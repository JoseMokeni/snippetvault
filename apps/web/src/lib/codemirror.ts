import { EditorView } from "@uiw/react-codemirror";
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
export const getLanguageExtension = (language: string) => {
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

// Custom theme for read-only code viewer - matches app styling
export const codeViewerTheme = EditorView.theme({
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

// Custom theme for editable code editor - matches app styling
export const codeEditorTheme = EditorView.theme({
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

// Basic setup for read-only code viewer
export const codeViewerBasicSetup = {
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
};
