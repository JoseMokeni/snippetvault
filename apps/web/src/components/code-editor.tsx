import { useMemo, useCallback } from "react";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { getLanguageExtension, codeEditorTheme } from "@/lib/codemirror";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
  readOnly?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  language,
  placeholder = "// Write your code here...",
  readOnly = false,
}: CodeEditorProps) {
  const extensions = useMemo(() => {
    const langExt = getLanguageExtension(language);
    return [
      codeEditorTheme,
      EditorView.lineWrapping,
      ...(Array.isArray(langExt) ? langExt : [langExt]),
    ];
  }, [language]);

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  return (
    <div className="code-editor-wrapper h-full w-full overflow-hidden">
      <CodeMirror
        value={value}
        onChange={handleChange}
        theme={vscodeDark}
        extensions={extensions}
        placeholder={placeholder}
        readOnly={readOnly}
        height="100%"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: false,
          highlightSelectionMatches: true,
          searchKeymap: true,
          tabSize: 2,
        }}
        className="h-full [&_.cm-editor]:h-full [&_.cm-scroller]:!overflow-auto"
      />
    </div>
  );
}
