import { useState, useMemo } from "react";
import {
  FileCode,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
} from "lucide-react";
import { SyntaxHighlighter } from "./syntax-highlighter";

interface FileData {
  id?: string;
  filename: string;
  content: string;
  language?: string | null;
  order: number;
}

interface Variable {
  id: string;
  name: string;
  defaultValue?: string | null;
  description?: string | null;
}

interface FileTreeViewerProps {
  files: FileData[];
  variables?: Variable[];
  variableValues?: Record<string, string>;
}

// File type icons based on extension
const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    ts: "📘",
    tsx: "⚛️",
    js: "📒",
    jsx: "⚛️",
    json: "📋",
    md: "📝",
    py: "🐍",
    go: "🔵",
    rs: "🦀",
    rb: "💎",
    java: "☕",
    html: "🌐",
    css: "🎨",
    scss: "🎨",
    yaml: "⚙️",
    yml: "⚙️",
    dockerfile: "🐳",
    sh: "📜",
    sql: "🗃️",
  };
  return iconMap[ext || ""] || "📄";
};

// Tree node structure
interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
  fileIndex?: number;
}

// Build tree from flat file list
function buildFileTree(files: FileData[]): TreeNode[] {
  const root: TreeNode[] = [];

  files.forEach((file, index) => {
    const parts = file.filename.split("/");
    let current = root;

    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join("/");

      let node = current.find((n) => n.name === part);

      if (!node) {
        node = {
          name: part,
          path,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
          fileIndex: isFile ? index : undefined,
        };
        current.push(node);
      }

      if (!isFile && node.children) {
        current = node.children;
      }
    });
  });

  // Sort: folders first, then files, alphabetically
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((node) => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined,
      }));
  };

  return sortNodes(root);
}

// Get all folder paths for auto-expansion
function getAllFolderPaths(nodes: TreeNode[]): string[] {
  const paths: string[] = [];
  const collect = (nodeList: TreeNode[]) => {
    for (const node of nodeList) {
      if (node.type === "folder") {
        paths.push(node.path);
        if (node.children) collect(node.children);
      }
    }
  };
  collect(nodes);
  return paths;
}

// Replace variables in content
function replaceVariables(
  content: string,
  variables: Variable[],
  values: Record<string, string>
): string {
  let result = content;
  for (const variable of variables) {
    const value = values[variable.name] || variable.defaultValue || "";
    const regex = new RegExp(`\\{\\{\\s*${variable.name}\\s*\\}\\}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

// Tree node component (read-only)
interface TreeNodeProps {
  node: TreeNode;
  level: number;
  selectedPath: string | null;
  expandedFolders: Set<string>;
  onSelect: (node: TreeNode) => void;
  onToggleFolder: (path: string) => void;
}

function TreeNodeComponent({
  node,
  level,
  selectedPath,
  expandedFolders,
  onSelect,
  onToggleFolder,
}: TreeNodeProps) {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedPath === node.path;

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1.5 px-2 cursor-pointer text-sm transition-colors ${
          isSelected
            ? "bg-accent/20 text-accent"
            : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          if (node.type === "folder") {
            onToggleFolder(node.path);
          } else {
            onSelect(node);
          }
        }}
      >
        {node.type === "folder" ? (
          <>
            <span className="text-text-tertiary">
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </span>
            <span className="text-accent">
              {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
            </span>
          </>
        ) : (
          <>
            <span className="w-[14px]" />
            <span>{getFileIcon(node.name)}</span>
          </>
        )}
        <span className="truncate flex-1 font-mono">{node.name}</span>
      </div>

      {/* Children */}
      {node.type === "folder" && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.path}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              expandedFolders={expandedFolders}
              onSelect={onSelect}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTreeViewer({
  files,
  variables = [],
  variableValues = {},
}: FileTreeViewerProps) {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [showFileTree, setShowFileTree] = useState(false);

  // Build tree from files
  const tree = useMemo(() => buildFileTree(files), [files]);

  // Auto-expand all folders initially
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    return new Set(getAllFolderPaths(tree));
  });

  // Select first file by default
  const [selectedPath, setSelectedPath] = useState<string | null>(
    files[0]?.filename || null
  );

  // Find selected file
  const selectedFileIndex = files.findIndex((f) => f.filename === selectedPath);
  const selectedFile = selectedFileIndex >= 0 ? files[selectedFileIndex] : null;

  // Handle folder toggle
  const handleToggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Handle file selection
  const handleSelect = (node: TreeNode) => {
    if (node.type === "file") {
      setSelectedPath(node.path);
      setShowFileTree(false); // Close sidebar on mobile after selection
    }
  };

  // Copy file content
  const handleCopy = async () => {
    if (!selectedFile) return;
    const content = replaceVariables(
      selectedFile.content,
      variables,
      variableValues
    );
    await navigator.clipboard.writeText(content);
    setCopiedFile(selectedFile.filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  // Use original content to show variables highlighted
  const displayContent = selectedFile ? selectedFile.content : "";

  return (
    <div className="terminal-block rounded-lg overflow-hidden border border-border">
      {/* Mobile file selector button */}
      <div className="lg:hidden border-b border-border bg-bg-secondary">
        <button
          onClick={() => setShowFileTree(!showFileTree)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-bg-elevated transition-colors"
        >
          <div className="flex items-center gap-2">
            <span>
              {selectedFile ? getFileIcon(selectedFile.filename) : "📁"}
            </span>
            <span className="font-mono text-text-primary truncate">
              {selectedFile ? selectedFile.filename : "Select a file"}
            </span>
          </div>
          <ChevronDown
            size={16}
            className={`text-text-tertiary transition-transform ${
              showFileTree ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Mobile file tree dropdown */}
        {showFileTree && (
          <div className="border-t border-border bg-bg-primary max-h-[300px] overflow-y-auto">
            {tree.map((node) => (
              <TreeNodeComponent
                key={node.path}
                node={node}
                level={0}
                selectedPath={selectedPath}
                expandedFolders={expandedFolders}
                onSelect={handleSelect}
                onToggleFolder={handleToggleFolder}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex h-[400px] lg:h-[500px]">
        {/* File tree sidebar - Desktop only */}
        <div className="hidden lg:flex w-64 border-r border-border bg-bg-primary flex-col">
          <div className="px-3 py-2 border-b border-border bg-bg-secondary">
            <span className="text-xs font-display text-text-tertiary uppercase tracking-wider">
              Files
            </span>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {tree.map((node) => (
              <TreeNodeComponent
                key={node.path}
                node={node}
                level={0}
                selectedPath={selectedPath}
                expandedFolders={expandedFolders}
                onSelect={handleSelect}
                onToggleFolder={handleToggleFolder}
              />
            ))}
          </div>
        </div>

        {/* File content viewer */}
        <div className="flex-1 flex flex-col bg-bg-secondary">
          {selectedFile ? (
            <>
              {/* File header */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border bg-bg-primary">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="flex-shrink-0">
                    {getFileIcon(selectedFile.filename)}
                  </span>
                  <span className="text-xs sm:text-sm font-mono text-text-primary truncate">
                    {selectedFile.filename}
                  </span>
                  {selectedFile.language && (
                    <span className="hidden sm:inline text-xs text-text-tertiary bg-bg-elevated px-2 py-0.5 rounded flex-shrink-0">
                      {selectedFile.language}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1 text-xs text-text-secondary hover:text-text-primary border border-border hover:border-text-tertiary transition-colors flex-shrink-0"
                >
                  {copiedFile === selectedFile.filename ? (
                    <>
                      <Check size={12} className="text-success" />
                      <span className="hidden sm:inline">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code content */}
              <div className="flex-1 overflow-auto p-2 sm:p-4 bg-bg-code">
                <SyntaxHighlighter
                  code={displayContent}
                  language={selectedFile.language || "plaintext"}
                  showLineNumbers
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-tertiary">
              <div className="text-center">
                <FileCode size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a file to view its contents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
