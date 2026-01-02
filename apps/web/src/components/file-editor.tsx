import { useState, useRef, useEffect } from "react";
import { Plus, FileCode, Trash2, Edit2, Check, X } from "lucide-react";

interface FileData {
  id?: string;
  filename: string;
  content: string;
  language: string;
  order: number;
}

interface FileEditorProps {
  files: FileData[];
  onChange: (files: FileData[]) => void;
}

export function FileEditor({ files, onChange }: FileEditorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingFilename, setEditingFilename] = useState<number | null>(null);
  const [tempFilename, setTempFilename] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedFile = files[selectedIndex];

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

  const handleAddFile = () => {
    const newFile: FileData = {
      filename: `file${files.length + 1}.txt`,
      content: "",
      language: "plaintext",
      order: files.length,
    };
    onChange([...files, newFile]);
    setSelectedIndex(files.length);
  };

  const handleRemoveFile = (index: number) => {
    if (files.length <= 1) return;
    const updated = files.filter((_, i) => i !== index);
    onChange(updated.map((f, i) => ({ ...f, order: i })));
    if (selectedIndex >= updated.length) {
      setSelectedIndex(updated.length - 1);
    }
  };

  const handleUpdateFile = (index: number, updates: Partial<FileData>) => {
    const updated = [...files];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleStartEditFilename = (index: number) => {
    setEditingFilename(index);
    setTempFilename(files[index].filename);
  };

  const handleSaveFilename = () => {
    if (editingFilename !== null && tempFilename.trim()) {
      handleUpdateFile(editingFilename, { filename: tempFilename.trim() });
      // Auto-detect language from extension
      const ext = tempFilename.split(".").pop()?.toLowerCase();
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
      const language = languageMap[ext || ""] || "plaintext";
      handleUpdateFile(editingFilename, { language });
    }
    setEditingFilename(null);
  };

  const handleCancelEditFilename = () => {
    setEditingFilename(null);
    setTempFilename("");
  };

  return (
    <div className="terminal-block rounded-lg overflow-hidden">
      {/* File tabs */}
      <div className="flex items-center border-b border-border bg-bg-secondary overflow-x-auto">
        {files.map((file, index) => (
          <div
            key={index}
            className={`group flex items-center gap-2 px-3 py-2 text-sm font-display border-r border-border cursor-pointer transition-colors ${
              selectedIndex === index
                ? "bg-bg-code text-text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            }`}
            onClick={() => setSelectedIndex(index)}
          >
            <FileCode size={14} />

            {editingFilename === index ? (
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={tempFilename}
                  onChange={(e) => setTempFilename(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveFilename();
                    if (e.key === "Escape") handleCancelEditFilename();
                  }}
                  className="w-24 bg-bg-primary border border-accent px-1 py-0.5 text-xs focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveFilename}
                  className="text-success hover:opacity-80"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={handleCancelEditFilename}
                  className="text-error hover:opacity-80"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <>
                <span className="truncate max-w-[120px]">{file.filename}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEditFilename(index);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-text-primary transition-opacity"
                >
                  <Edit2 size={12} />
                </button>
              </>
            )}

            {files.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(index);
                }}
                className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-error transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={handleAddFile}
          className="flex items-center gap-1 px-3 py-2 text-sm text-text-tertiary hover:text-accent transition-colors"
        >
          <Plus size={14} />
          <span>Add File</span>
        </button>
      </div>

      {/* Editor */}
      {selectedFile && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs text-text-tertiary mb-1 font-display">
                  Language
                </label>
                <select
                  value={selectedFile.language}
                  onChange={(e) =>
                    handleUpdateFile(selectedIndex, {
                      language: e.target.value,
                    })
                  }
                  className="bg-bg-secondary border border-border px-2 py-1 text-sm font-display text-text-primary focus:border-accent focus:outline-none"
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
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={selectedFile.content}
              onChange={(e) =>
                handleUpdateFile(selectedIndex, { content: e.target.value })
              }
              placeholder="// Paste or write your code here..."
              className="w-full min-h-[300px] bg-bg-secondary border border-border p-4 font-display text-sm text-text-primary focus:border-accent focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
