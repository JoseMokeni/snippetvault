import { useState } from "react";
import { FileCode, Copy, Check, ChevronRight, ChevronDown } from "lucide-react";

interface File {
  id: string;
  filename: string;
  content: string;
  language: string | null;
  order: number;
}

interface Variable {
  id: string;
  name: string;
  defaultValue: string | null;
  description: string | null;
}

interface CodeViewerProps {
  files: File[];
  variables?: Variable[];
  variableValues?: Record<string, string>;
}

export function CodeViewer({
  files,
  variables = [],
  variableValues = {},
}: CodeViewerProps) {
  const [selectedFileId, setSelectedFileId] = useState(files[0]?.id);
  const [copied, setCopied] = useState(false);

  const selectedFile = files.find((f) => f.id === selectedFileId) || files[0];

  // Replace variables in content
  const processedContent = selectedFile?.content
    ? variables.reduce((content, variable) => {
        const value =
          variableValues[variable.name] || variable.defaultValue || "";
        const regex = new RegExp(`{{${variable.name}}}`, "g");
        return content.replace(regex, value);
      }, selectedFile.content)
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(processedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = processedContent.split("\n");

  return (
    <div className="terminal-block rounded-lg overflow-hidden">
      {/* File tabs */}
      {files.length > 1 && (
        <div className="flex border-b border-border bg-bg-secondary overflow-x-auto">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => setSelectedFileId(file.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-display whitespace-nowrap border-r border-border transition-colors ${
                selectedFileId === file.id
                  ? "bg-bg-code text-text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              }`}
            >
              <FileCode size={14} />
              {file.filename}
            </button>
          ))}
        </div>
      )}

      {/* Single file header */}
      {files.length === 1 && (
        <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-border">
          <div className="flex items-center gap-2 text-sm font-display text-text-secondary">
            <FileCode size={14} />
            {selectedFile?.filename}
          </div>
        </div>
      )}

      {/* Code content */}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-1.5 bg-bg-elevated border border-border text-xs font-display text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
        >
          {copied ? (
            <>
              <Check size={12} className="text-success" />
              Copied!
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>

        <div className="overflow-x-auto">
          <pre className="p-4 text-sm leading-relaxed">
            <code>
              {lines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="select-none text-text-tertiary w-12 text-right pr-4 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1">
                    <HighlightedLine line={line} />
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

// Basic syntax highlighting
function HighlightedLine({ line }: { line: string }) {
  // Highlight variable placeholders
  const parts = line.split(/({{[^}]+}})/);

  return (
    <>
      {parts.map((part, i) => {
        if (part.match(/^{{[^}]+}}$/)) {
          return (
            <span
              key={i}
              className="text-syntax-variable bg-syntax-variable/10 px-1 rounded"
            >
              {part}
            </span>
          );
        }
        // Highlight comments
        if (part.match(/^\s*(#|\/\/)/)) {
          return (
            <span key={i} className="text-syntax-comment">
              {part}
            </span>
          );
        }
        // Highlight strings
        const stringParts = part.split(/("[^"]*"|'[^']*')/);
        return stringParts.map((sp, j) => {
          if (sp.match(/^["'][^"']*["']$/)) {
            return (
              <span key={`${i}-${j}`} className="text-syntax-string">
                {sp}
              </span>
            );
          }
          // Highlight keywords
          const keywordParts = sp.split(
            /\b(const|let|var|function|return|if|else|for|while|import|export|from|class|extends|new|async|await|try|catch|throw)\b/
          );
          return keywordParts.map((kp, k) => {
            if (
              kp.match(
                /^(const|let|var|function|return|if|else|for|while|import|export|from|class|extends|new|async|await|try|catch|throw)$/
              )
            ) {
              return (
                <span key={`${i}-${j}-${k}`} className="text-syntax-keyword">
                  {kp}
                </span>
              );
            }
            return <span key={`${i}-${j}-${k}`}>{kp}</span>;
          });
        });
      })}
    </>
  );
}

// File tree component for larger file sets
interface FileTreeProps {
  files: File[];
  selectedFileId: string;
  onSelectFile: (id: string) => void;
}

export function FileTree({
  files,
  selectedFileId,
  onSelectFile,
}: FileTreeProps) {
  // Group files by directory
  const fileTree = files.reduce((tree, file) => {
    const parts = file.filename.split("/");
    let current: TreeNodeType = tree;

    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        // It's a file
        if (!current.files) current.files = [];
        current.files.push(file);
      } else {
        // It's a directory
        if (!current.dirs) current.dirs = {};
        if (!current.dirs[part]) current.dirs[part] = {};
        current = current.dirs[part];
      }
    });

    return tree;
  }, {} as TreeNodeType);

  return (
    <div className="text-sm">
      <TreeNode
        name="Files"
        node={fileTree}
        selectedFileId={selectedFileId}
        onSelectFile={onSelectFile}
        depth={0}
      />
    </div>
  );
}

type TreeNodeType = { files?: File[]; dirs?: Record<string, TreeNodeType> };

interface TreeNodeProps {
  name: string;
  node: TreeNodeType;
  selectedFileId: string;
  onSelectFile: (id: string) => void;
  depth: number;
}

function TreeNode({
  name,
  node,
  selectedFileId,
  onSelectFile,
  depth,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren =
    (node.dirs && Object.keys(node.dirs).length > 0) ||
    (node.files && node.files.length > 0);

  return (
    <div>
      {depth > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 w-full px-2 py-1 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded transition-colors"
          style={{ paddingLeft: `${depth * 12}px` }}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <span className="w-[14px]" />
          )}
          <span>{name}</span>
        </button>
      )}

      {expanded && (
        <>
          {node.dirs &&
            Object.entries(node.dirs).map(([dirName, dirNode]) => (
              <TreeNode
                key={dirName}
                name={dirName}
                node={dirNode as TreeNodeType}
                selectedFileId={selectedFileId}
                onSelectFile={onSelectFile}
                depth={depth + 1}
              />
            ))}
          {node.files &&
            node.files.map((file) => (
              <button
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`flex items-center gap-2 w-full px-2 py-1 rounded transition-colors ${
                  selectedFileId === file.id
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                }`}
                style={{ paddingLeft: `${(depth + 1) * 12}px` }}
              >
                <FileCode size={14} />
                <span className="truncate">
                  {file.filename.split("/").pop()}
                </span>
              </button>
            ))}
        </>
      )}
    </div>
  );
}
