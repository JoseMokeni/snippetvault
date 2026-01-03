import { useState, useRef, useEffect, useMemo } from "react";
import {
  FileCode,
  Folder,
  FolderOpen,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  FilePlus,
} from "lucide-react";
import { showError } from "@/lib/toast";

interface FileData {
  id?: string;
  filename: string;
  content: string;
  language: string;
  order: number;
}

interface FileTreeEditorProps {
  files: FileData[];
  onChange: (files: FileData[]) => void;
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

// Language detection from extension
const detectLanguage = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    cs: "csharp",
    cpp: "cpp",
    c: "c",
    h: "c",
    hpp: "cpp",
    php: "php",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    md: "markdown",
    sql: "sql",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    dockerfile: "dockerfile",
    docker: "dockerfile",
    makefile: "makefile",
    toml: "toml",
    ini: "ini",
    env: "plaintext",
    txt: "plaintext",
  };
  return languageMap[ext || ""] || "plaintext";
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

// Tree node component
interface TreeNodeProps {
  node: TreeNode;
  level: number;
  selectedPath: string | null;
  expandedFolders: Set<string>;
  onSelect: (node: TreeNode) => void;
  onToggleFolder: (path: string) => void;
  onDelete: (node: TreeNode) => void;
  onRename: (node: TreeNode) => void;
}

function TreeNodeComponent({
  node,
  level,
  selectedPath,
  expandedFolders,
  onSelect,
  onToggleFolder,
  onDelete,
  onRename,
}: TreeNodeProps) {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedPath === node.path;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 py-1 px-2 cursor-pointer text-sm transition-colors ${
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
            <span>
              {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
            </span>
          </>
        ) : (
          <>
            <span className="w-[14px]" />
            <span>{getFileIcon(node.name)}</span>
          </>
        )}
        <span className="truncate flex-1">{node.name}</span>

        {/* Action buttons */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRename(node);
            }}
            className="p-0.5 text-text-tertiary hover:text-text-primary"
            title="Rename"
          >
            <Edit2 size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
            className="p-0.5 text-text-tertiary hover:text-error"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
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
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTreeEditor({ files, onChange }: FileTreeEditorProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(
    files[0]?.filename || null
  );
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [renamingNode, setRenamingNode] = useState<TreeNode | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showFileTree, setShowFileTree] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Build tree from files
  const tree = useMemo(() => buildFileTree(files), [files]);

  // Find selected file
  const selectedFileIndex = files.findIndex((f) => f.filename === selectedPath);
  const selectedFile = selectedFileIndex >= 0 ? files[selectedFileIndex] : null;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(
        300,
        textareaRef.current.scrollHeight
      )}px`;
    }
  }, [selectedFile?.content]);

  // Helper to expand parent folders for a path
  const expandParentFolders = (path: string) => {
    const parts = path.split("/");
    setExpandedFolders((prev) => {
      const folders = new Set(prev);
      for (let i = 1; i < parts.length; i++) {
        folders.add(parts.slice(0, i).join("/"));
      }
      return folders;
    });
  };

  const handleToggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleSelectNode = (node: TreeNode) => {
    if (node.type === "file") {
      setSelectedPath(node.path);
      setShowFileTree(false); // Close sidebar on mobile after selection
      expandParentFolders(node.path);
    }
  };

  const handleAddFile = () => {
    if (!newItemName.trim()) return;

    const filename = newItemName.trim();

    // Check if file already exists
    if (files.some((f) => f.filename === filename)) {
      showError(`File "${filename}" already exists`);
      return;
    }

    const newFile: FileData = {
      filename,
      content: "",
      language: detectLanguage(filename),
      order: files.length,
    };
    onChange([...files, newFile]);
    setSelectedPath(filename);
    setIsAddingFile(false);
    setNewItemName("");

    // Expand parent folders
    const parts = filename.split("/");
    const folders = new Set(expandedFolders);
    for (let i = 1; i < parts.length; i++) {
      folders.add(parts.slice(0, i).join("/"));
    }
    setExpandedFolders(folders);
  };

  const handleAddFolder = () => {
    if (!newItemName.trim()) return;

    // Create a placeholder file to represent the folder
    const folderPath = newItemName.trim();
    const placeholderFile: FileData = {
      filename: `${folderPath}/.gitkeep`,
      content: "",
      language: "plaintext",
      order: files.length,
    };
    onChange([...files, placeholderFile]);
    setIsAddingFolder(false);
    setNewItemName("");

    // Expand the folder
    setExpandedFolders(new Set([...expandedFolders, folderPath]));
  };

  const handleDeleteNode = (node: TreeNode) => {
    if (node.type === "file") {
      if (files.length <= 1) {
        alert("Cannot delete the last file");
        return;
      }
      const updated = files.filter((f) => f.filename !== node.path);
      onChange(updated.map((f, i) => ({ ...f, order: i })));
      if (selectedPath === node.path) {
        setSelectedPath(updated[0]?.filename || null);
      }
    } else {
      // Delete all files in folder
      const folderPath = node.path + "/";
      const filesToDelete = files.filter(
        (f) => f.filename.startsWith(folderPath) || f.filename === node.path
      );
      if (filesToDelete.length > 0) {
        if (
          !confirm(
            `Delete folder "${node.name}" and ${filesToDelete.length} file(s)?`
          )
        ) {
          return;
        }
      }
      const updated = files.filter(
        (f) => !f.filename.startsWith(folderPath) && f.filename !== node.path
      );
      if (updated.length === 0) {
        alert("Cannot delete all files");
        return;
      }
      onChange(updated.map((f, i) => ({ ...f, order: i })));
      if (selectedPath?.startsWith(folderPath)) {
        setSelectedPath(updated[0]?.filename || null);
      }
    }
  };

  const handleStartRename = (node: TreeNode) => {
    setRenamingNode(node);
    setRenameValue(node.name);
  };

  const handleRename = () => {
    if (!renamingNode || !renameValue.trim()) {
      setRenamingNode(null);
      return;
    }

    const oldPath = renamingNode.path;
    const parts = oldPath.split("/");
    parts[parts.length - 1] = renameValue.trim();
    const newPath = parts.join("/");

    // Check if new name already exists (and it's not the same file)
    if (oldPath !== newPath && files.some((f) => f.filename === newPath)) {
      showError(`A file named "${newPath}" already exists`);
      return;
    }

    if (renamingNode.type === "file") {
      const updated = files.map((f) =>
        f.filename === oldPath
          ? { ...f, filename: newPath, language: detectLanguage(newPath) }
          : f
      );
      onChange(updated);
      if (selectedPath === oldPath) {
        setSelectedPath(newPath);
      }
    } else {
      // Rename all files in folder
      const oldFolderPath = oldPath + "/";
      const updated = files.map((f) => {
        if (f.filename.startsWith(oldFolderPath)) {
          return { ...f, filename: f.filename.replace(oldPath, newPath) };
        }
        return f;
      });
      onChange(updated);
      if (selectedPath?.startsWith(oldFolderPath)) {
        setSelectedPath(selectedPath.replace(oldPath, newPath));
      }

      // Update expanded folders
      const newExpanded = new Set<string>();
      expandedFolders.forEach((path) => {
        if (path.startsWith(oldPath)) {
          newExpanded.add(path.replace(oldPath, newPath));
        } else {
          newExpanded.add(path);
        }
      });
      setExpandedFolders(newExpanded);
    }

    setRenamingNode(null);
    setRenameValue("");
  };

  const handleUpdateFile = (updates: Partial<FileData>) => {
    if (selectedFileIndex < 0) return;
    const updated = [...files];
    updated[selectedFileIndex] = { ...updated[selectedFileIndex], ...updates };
    onChange(updated);
  };

  return (
    <div className="terminal-block rounded-lg overflow-hidden">
      {/* Mobile file selector button */}
      <div className="lg:hidden border-b border-border bg-bg-secondary">
        <button
          type="button"
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddingFile(true);
                setIsAddingFolder(false);
                setShowFileTree(true);
              }}
              className="p-1.5 text-text-tertiary hover:text-accent transition-colors"
              title="New File"
            >
              <FilePlus size={16} />
            </button>
            <ChevronDown
              size={16}
              className={`text-text-tertiary transition-transform ${
                showFileTree ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Mobile file tree dropdown */}
        {showFileTree && (
          <div className="border-t border-border bg-bg-primary">
            {/* Add/Rename inputs - Mobile */}
            {(isAddingFile || isAddingFolder) && (
              <div className="p-3 border-b border-border">
                <div className="flex items-center gap-1">
                  <span className="text-text-tertiary">
                    {isAddingFile ? (
                      <FileCode size={14} />
                    ) : (
                      <Folder size={14} />
                    )}
                  </span>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (isAddingFile) {
                          handleAddFile();
                        } else {
                          handleAddFolder();
                        }
                      }
                      if (e.key === "Escape") {
                        setIsAddingFile(false);
                        setIsAddingFolder(false);
                        setNewItemName("");
                      }
                    }}
                    placeholder={
                      isAddingFile ? "path/to/file.ts" : "folder/name"
                    }
                    className="flex-1 bg-bg-secondary border border-accent px-2 py-1.5 text-xs focus:outline-none text-text-primary"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={isAddingFile ? handleAddFile : handleAddFolder}
                    className="p-1.5 text-success hover:opacity-80"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingFile(false);
                      setIsAddingFolder(false);
                      setNewItemName("");
                    }}
                    className="p-1.5 text-error hover:opacity-80"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="max-h-[300px] overflow-y-auto py-2">
              {tree.length === 0 ? (
                <div className="p-4 text-center text-text-tertiary text-sm">
                  <p>No files yet</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingFile(true);
                      setShowFileTree(true);
                    }}
                    className="text-accent hover:text-accent-hover mt-2"
                  >
                    Add your first file
                  </button>
                </div>
              ) : (
                tree.map((node) => (
                  <TreeNodeComponent
                    key={node.path}
                    node={node}
                    level={0}
                    selectedPath={selectedPath}
                    expandedFolders={expandedFolders}
                    onSelect={handleSelectNode}
                    onToggleFolder={handleToggleFolder}
                    onDelete={handleDeleteNode}
                    onRename={handleStartRename}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex h-[400px] lg:h-[500px]">
        {/* File Tree Sidebar - Desktop only */}
        <div className="hidden lg:flex lg:w-64 border-r border-border bg-bg-secondary flex-col">
          {/* Tree Header */}
          <div className="p-2 border-b border-border flex items-center justify-between">
            <span className="text-xs font-display text-text-tertiary uppercase tracking-wider">
              Files
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsAddingFile(true);
                  setIsAddingFolder(false);
                }}
                className="p-1 text-text-tertiary hover:text-accent transition-colors"
                title="New File"
              >
                <FilePlus size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingFolder(true);
                  setIsAddingFile(false);
                }}
                className="p-1 text-text-tertiary hover:text-accent transition-colors"
                title="New Folder"
              >
                <FolderPlus size={14} />
              </button>
            </div>
          </div>

          {/* Add File/Folder Input */}
          {(isAddingFile || isAddingFolder) && (
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-1">
                <span className="text-text-tertiary">
                  {isAddingFile ? <FileCode size={14} /> : <Folder size={14} />}
                </span>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (isAddingFile) {
                        handleAddFile();
                      } else {
                        handleAddFolder();
                      }
                    }
                    if (e.key === "Escape") {
                      setIsAddingFile(false);
                      setIsAddingFolder(false);
                      setNewItemName("");
                    }
                  }}
                  placeholder={isAddingFile ? "path/to/file.ts" : "folder/name"}
                  className="flex-1 bg-bg-primary border border-accent px-2 py-1 text-xs focus:outline-none text-text-primary"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={isAddingFile ? handleAddFile : handleAddFolder}
                  className="p-1 text-success hover:opacity-80"
                >
                  <Check size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingFile(false);
                    setIsAddingFolder(false);
                    setNewItemName("");
                  }}
                  className="p-1 text-error hover:opacity-80"
                >
                  <X size={12} />
                </button>
              </div>
              <p className="text-xs text-text-tertiary mt-1">
                {isAddingFile
                  ? "Use / to create folders (e.g., src/index.ts)"
                  : "Folders are created automatically"}
              </p>
            </div>
          )}

          {/* Rename Input */}
          {renamingNode && (
            <div className="p-2 border-b border-border bg-bg-elevated">
              <p className="text-xs text-text-tertiary mb-1">
                Rename {renamingNode.type}: {renamingNode.path}
              </p>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") setRenamingNode(null);
                  }}
                  className="flex-1 bg-bg-primary border border-accent px-2 py-1 text-xs focus:outline-none text-text-primary"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleRename}
                  className="p-1 text-success hover:opacity-80"
                >
                  <Check size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setRenamingNode(null)}
                  className="p-1 text-error hover:opacity-80"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Tree */}
          <div className="flex-1 overflow-auto py-2">
            {tree.length === 0 ? (
              <div className="p-4 text-center text-text-tertiary text-sm">
                <p>No files yet</p>
                <button
                  type="button"
                  onClick={() => setIsAddingFile(true)}
                  className="text-accent hover:text-accent-hover mt-2"
                >
                  Add your first file
                </button>
              </div>
            ) : (
              tree.map((node) => (
                <TreeNodeComponent
                  key={node.path}
                  node={node}
                  level={0}
                  selectedPath={selectedPath}
                  expandedFolders={expandedFolders}
                  onSelect={handleSelectNode}
                  onToggleFolder={handleToggleFolder}
                  onDelete={handleDeleteNode}
                  onRename={handleStartRename}
                />
              ))
            )}
          </div>
        </div>

        {/* Editor Panel */}
        <div className="flex-1 flex flex-col">
          {selectedFile ? (
            <>
              {/* File Info Header */}
              <div className="p-2 sm:p-3 border-b border-border bg-bg-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                  <span className="flex-shrink-0">
                    {getFileIcon(selectedFile.filename)}
                  </span>
                  <span className="font-display text-text-primary truncate">
                    {selectedFile.filename}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs text-text-tertiary flex-shrink-0">
                    Language:
                  </label>
                  <select
                    value={selectedFile.language}
                    onChange={(e) =>
                      handleUpdateFile({ language: e.target.value })
                    }
                    className="flex-1 sm:flex-none bg-bg-primary border border-border px-2 py-1 text-xs font-display text-text-primary focus:border-accent focus:outline-none"
                  >
                    <option value="plaintext">Plain Text</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="cpp">C++</option>
                    <option value="ruby">Ruby</option>
                    <option value="php">PHP</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="json">JSON</option>
                    <option value="yaml">YAML</option>
                    <option value="xml">XML</option>
                    <option value="markdown">Markdown</option>
                    <option value="sql">SQL</option>
                    <option value="bash">Bash</option>
                    <option value="dockerfile">Dockerfile</option>
                  </select>
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1 overflow-auto p-2 sm:p-4">
                <textarea
                  ref={textareaRef}
                  value={selectedFile.content}
                  onChange={(e) =>
                    handleUpdateFile({ content: e.target.value })
                  }
                  placeholder="// Paste or write your code here..."
                  className="w-full h-full min-h-[400px] bg-bg-code border border-border p-4 font-mono text-sm text-text-primary focus:border-accent focus:outline-none resize-none leading-relaxed"
                  spellCheck={false}
                  style={{
                    whiteSpace: "pre",
                    overflowWrap: "normal",
                    wordWrap: "normal",
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-tertiary">
              <div className="text-center">
                <FileCode size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a file to edit</p>
                <p className="text-sm mt-1">
                  or create a new file using the + button
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
