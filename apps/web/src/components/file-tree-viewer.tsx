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
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { sql } from "@codemirror/lang-sql";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { php } from "@codemirror/lang-php";
import { StreamLanguage } from "@codemirror/language";
import { dockerFile } from "@codemirror/legacy-modes/mode/dockerfile";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { swift } from "@codemirror/legacy-modes/mode/swift";
import { r } from "@codemirror/legacy-modes/mode/r";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { perl } from "@codemirror/legacy-modes/mode/perl";
import { powerShell } from "@codemirror/legacy-modes/mode/powershell";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import { diff } from "@codemirror/legacy-modes/mode/diff";
import { nginx } from "@codemirror/legacy-modes/mode/nginx";
import { properties } from "@codemirror/legacy-modes/mode/properties";

// Map language strings to CodeMirror extensions
const getLanguageExtension = (language: string) => {
  const lang = language.toLowerCase();

  // Modern CodeMirror language packages
  const modernLanguages: Record<string, () => ReturnType<typeof javascript>> = {
    javascript: () => javascript({ jsx: true }),
    js: () => javascript({ jsx: true }),
    typescript: () => javascript({ jsx: true, typescript: true }),
    ts: () => javascript({ jsx: true, typescript: true }),
    jsx: () => javascript({ jsx: true }),
    tsx: () => javascript({ jsx: true, typescript: true }),
    python: () => python(),
    py: () => python(),
    html: () => html(),
    htm: () => html(),
    css: () => css(),
    scss: () => css(),
    sass: () => css(),
    less: () => css(),
    json: () => json(),
    jsonc: () => json(),
    markdown: () => markdown(),
    md: () => markdown(),
    sql: () => sql(),
    mysql: () => sql(),
    postgresql: () => sql(),
    sqlite: () => sql(),
    xml: () => xml(),
    svg: () => xml(),
    yaml: () => yaml(),
    yml: () => yaml(),
    rust: () => rust(),
    rs: () => rust(),
    go: () => go(),
    golang: () => go(),
    java: () => java(),
    kotlin: () => java(),
    kt: () => java(),
    scala: () => java(),
    cpp: () => cpp(),
    "c++": () => cpp(),
    c: () => cpp(),
    h: () => cpp(),
    hpp: () => cpp(),
    csharp: () => cpp(),
    "c#": () => cpp(),
    cs: () => cpp(),
    php: () => php(),
  };

  // Legacy mode languages (using StreamLanguage wrapper)
  const legacyLanguages: Record<
    string,
    () => ReturnType<typeof StreamLanguage.define>
  > = {
    dockerfile: () => StreamLanguage.define(dockerFile),
    docker: () => StreamLanguage.define(dockerFile),
    bash: () => StreamLanguage.define(shell),
    sh: () => StreamLanguage.define(shell),
    shell: () => StreamLanguage.define(shell),
    zsh: () => StreamLanguage.define(shell),
    fish: () => StreamLanguage.define(shell),
    ruby: () => StreamLanguage.define(ruby),
    rb: () => StreamLanguage.define(ruby),
    swift: () => StreamLanguage.define(swift),
    r: () => StreamLanguage.define(r),
    lua: () => StreamLanguage.define(lua),
    perl: () => StreamLanguage.define(perl),
    pl: () => StreamLanguage.define(perl),
    powershell: () => StreamLanguage.define(powerShell),
    ps1: () => StreamLanguage.define(powerShell),
    toml: () => StreamLanguage.define(toml),
    ini: () => StreamLanguage.define(properties),
    properties: () => StreamLanguage.define(properties),
    env: () => StreamLanguage.define(properties),
    diff: () => StreamLanguage.define(diff),
    patch: () => StreamLanguage.define(diff),
    nginx: () => StreamLanguage.define(nginx),
    conf: () => StreamLanguage.define(nginx),
  };

  // Check modern languages first
  if (modernLanguages[lang]) {
    return modernLanguages[lang]();
  }

  // Then check legacy languages
  if (legacyLanguages[lang]) {
    return legacyLanguages[lang]();
  }

  return [];
};

// Custom theme for read-only viewer - matches app styling
const viewerTheme = EditorView.theme({
  "&": {
    fontSize: "14px",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    backgroundColor: "transparent",
  },
  ".cm-content": {
    padding: "8px 0",
    caretColor: "transparent",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
    color: "rgba(255, 255, 255, 0.3)",
    paddingRight: "8px",
  },
  ".cm-gutter.cm-lineNumbers": {
    minWidth: "40px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(34, 211, 238, 0.2) !important",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "rgba(34, 211, 238, 0.3) !important",
  },
  ".cm-cursor": {
    display: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
  "&.cm-focused": {
    outline: "none",
  },
});

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

  // CodeMirror extensions for the selected file
  const extensions = useMemo(() => {
    const language = selectedFile?.language || "plaintext";
    const langExt = getLanguageExtension(language);
    return [
      viewerTheme,
      EditorView.editable.of(false),
      EditorView.lineWrapping,
      ...(Array.isArray(langExt) ? langExt : [langExt]),
    ];
  }, [selectedFile?.language]);

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
        <div className="hidden lg:flex w-64 flex-shrink-0 border-r border-border bg-bg-primary flex-col">
          <div className="px-3 h-10 flex items-center border-b border-border bg-bg-secondary">
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
        <div className="flex-1 min-w-0 flex flex-col bg-bg-secondary">
          {selectedFile ? (
            <>
              {/* File header */}
              <div className="flex items-center justify-between px-3 sm:px-4 h-10 border-b border-border bg-bg-primary">
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
              <div className="flex-1 overflow-hidden bg-bg-code">
                <CodeMirror
                  value={displayContent}
                  theme={vscodeDark}
                  extensions={extensions}
                  readOnly={true}
                  editable={false}
                  height="100%"
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: false,
                    highlightActiveLine: false,
                    foldGutter: false,
                    dropCursor: false,
                    allowMultipleSelections: false,
                    indentOnInput: false,
                    bracketMatching: false,
                    closeBrackets: false,
                    autocompletion: false,
                    rectangularSelection: false,
                    crosshairCursor: false,
                    highlightSelectionMatches: false,
                    searchKeymap: false,
                    tabSize: 2,
                  }}
                  className="h-full [&_.cm-editor]:h-full [&_.cm-scroller]:!overflow-auto"
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
