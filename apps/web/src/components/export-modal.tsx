import { useState, useMemo, useEffect } from "react";
import { X, Download, Copy, Check, Eye } from "lucide-react";
import {
  exportAsZip,
  downloadBlob,
  copyToClipboard,
  exportAsText,
  substituteVariables,
} from "@/lib/export";
import { SyntaxHighlighter } from "./syntax-highlighter";
import { showSuccess, showError } from "@/lib/toast";

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

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  snippetTitle: string;
  files: FileData[];
  variables: Variable[];
  initialValues?: Record<string, string>;
}

export function ExportModal({
  isOpen,
  onClose,
  snippetTitle,
  files,
  variables,
  initialValues = {},
}: ExportModalProps) {
  // Initialize values with defaults
  const defaultValues = useMemo(() => {
    const defaults: Record<string, string> = {};
    for (const v of variables) {
      defaults[v.name] = initialValues[v.name] || v.defaultValue || "";
    }
    return defaults;
  }, [variables, initialValues]);

  const [values, setValues] = useState<Record<string, string>>(defaultValues);
  const [activeTab, setActiveTab] = useState<"config" | "preview">("config");
  const [previewFile, setPreviewFile] = useState<FileData | null>(
    files[0] || null
  );
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Reset values when modal opens or defaults change
  useEffect(() => {
    if (isOpen) {
      setValues(defaultValues);
      setPreviewFile(files[0] || null);
      setActiveTab("config");
    }
  }, [isOpen, defaultValues, files]);

  // Preview content with variables substituted
  const previewContent = useMemo(() => {
    if (!previewFile) return "";
    return substituteVariables(previewFile.content, variables, values);
  }, [previewFile, variables, values]);

  const handleValueChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      const blob = await exportAsZip(files, variables, values);
      const filename = `${snippetTitle.toLowerCase().replace(/\s+/g, "-")}.zip`;
      downloadBlob(blob, filename);
      showSuccess(`Exported ${filename}`);
    } catch {
      showError("Failed to export ZIP file");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyAll = async () => {
    const text = exportAsText(files, variables, values);
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showSuccess("Copied all files to clipboard");
    } else {
      showError("Failed to copy to clipboard");
    }
  };

  const handleCopyFile = async () => {
    if (!previewFile) return;
    const content = substituteVariables(previewFile.content, variables, values);
    const success = await copyToClipboard(content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showSuccess(`Copied ${previewFile.filename} to clipboard`);
    } else {
      showError("Failed to copy to clipboard");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-bg-primary border border-border rounded-lg overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-bold text-lg">Export Snippet</h2>
          <button
            onClick={onClose}
            className="p-1 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("config")}
            className={`px-4 py-2 text-sm font-display transition-colors ${
              activeTab === "config"
                ? "text-accent border-b-2 border-accent"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Configure Variables
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-sm font-display flex items-center gap-2 transition-colors ${
              activeTab === "preview"
                ? "text-accent border-b-2 border-accent"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Eye size={14} />
            Preview
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === "config" ? (
            <div className="space-y-4">
              {variables.length === 0 ? (
                <p className="text-text-secondary text-sm">
                  This snippet has no variables. You can export it directly.
                </p>
              ) : (
                <>
                  <p className="text-text-secondary text-sm mb-4">
                    Customize the variable values below. These will be
                    substituted in all files when exporting.
                  </p>

                  {variables.map((variable) => (
                    <div key={variable.id} className="space-y-1">
                      <label className="block">
                        <span className="text-sm font-display text-text-primary">
                          {`{{${variable.name}}}`}
                        </span>
                        {variable.description && (
                          <span className="text-xs text-text-tertiary ml-2">
                            — {variable.description}
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={values[variable.name] || ""}
                        onChange={(e) =>
                          handleValueChange(variable.name, e.target.value)
                        }
                        placeholder={variable.defaultValue || ""}
                        className="w-full bg-bg-secondary border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent placeholder:text-text-tertiary"
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* File selector */}
              {files.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {files.map((file) => (
                    <button
                      key={file.id || file.filename}
                      onClick={() => setPreviewFile(file)}
                      className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                        previewFile?.filename === file.filename
                          ? "bg-accent text-bg-primary"
                          : "bg-bg-secondary text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {file.filename}
                    </button>
                  ))}
                </div>
              )}

              {/* Preview */}
              {previewFile && (
                <div className="terminal-block rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-bg-elevated">
                    <span className="text-xs font-mono text-text-secondary">
                      {previewFile.filename}
                    </span>
                    <button
                      onClick={handleCopyFile}
                      className="p-1 text-text-tertiary hover:text-accent transition-colors"
                      title="Copy file"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="max-h-[400px] overflow-auto">
                    <SyntaxHighlighter
                      code={previewContent}
                      language={previewFile.language || "plaintext"}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-bg-secondary">
          <span className="text-xs text-text-tertiary">
            {files.length} file{files.length !== 1 ? "s" : ""} •{" "}
            {variables.length} variable{variables.length !== 1 ? "s" : ""}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-2 px-4 py-2 border border-border text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-colors text-sm"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              Copy All
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-bg-primary hover:bg-accent-hover transition-colors text-sm font-display disabled:opacity-50"
            >
              <Download size={14} />
              {isExporting ? "Exporting..." : "Download .zip"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
