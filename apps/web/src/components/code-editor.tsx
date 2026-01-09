import { useMemo, useCallback } from "react";
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

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
  readOnly?: boolean;
}

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

// Custom theme extensions to match app styling
const customTheme = EditorView.theme({
  "&": {
    fontSize: "14px",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  },
  ".cm-content": {
    padding: "16px 0",
    caretColor: "#22d3ee",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
    color: "rgba(255, 255, 255, 0.3)",
    paddingRight: "8px",
  },
  ".cm-gutter.cm-lineNumbers": {
    minWidth: "48px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "rgba(34, 211, 238, 0.1)",
    color: "#22d3ee",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(34, 211, 238, 0.2) !important",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "rgba(34, 211, 238, 0.3) !important",
  },
  ".cm-cursor": {
    borderLeftColor: "#22d3ee",
    borderLeftWidth: "2px",
  },
  ".cm-matchingBracket": {
    backgroundColor: "rgba(34, 211, 238, 0.3)",
    outline: "1px solid rgba(34, 211, 238, 0.5)",
  },
  ".cm-searchMatch": {
    backgroundColor: "rgba(255, 214, 0, 0.3)",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "rgba(255, 214, 0, 0.5)",
  },
  ".cm-placeholder": {
    color: "rgba(255, 255, 255, 0.3)",
    fontStyle: "italic",
  },
  ".cm-foldGutter": {
    width: "16px",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
});

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
      customTheme,
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
