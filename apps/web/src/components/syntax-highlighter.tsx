import { Highlight, themes, type Language } from "prism-react-renderer";

interface SyntaxHighlighterProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
}

// Map our language names to Prism language names
const languageMap: Record<string, Language> = {
  javascript: "javascript",
  typescript: "typescript",
  jsx: "jsx",
  tsx: "tsx",
  python: "python",
  go: "go",
  rust: "rust",
  java: "java",
  csharp: "csharp",
  cpp: "cpp",
  c: "c",
  ruby: "ruby",
  php: "php",
  html: "markup",
  css: "css",
  scss: "scss",
  json: "json",
  yaml: "yaml",
  xml: "markup",
  markdown: "markdown",
  sql: "sql",
  bash: "bash",
  shell: "bash",
  dockerfile: "docker",
  docker: "docker",
  plaintext: "plain",
  text: "plain",
  other: "plain",
};

// Custom dark theme matching Terminal Brutalism
const terminalTheme = {
  ...themes.vsDark,
  plain: {
    color: "#e0e0e0",
    backgroundColor: "transparent",
  },
  styles: [
    ...themes.vsDark.styles,
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "#6a737d" },
    },
    {
      types: ["punctuation"],
      style: { color: "#8b949e" },
    },
    {
      types: ["property", "tag", "boolean", "number", "constant", "symbol"],
      style: { color: "#79c0ff" },
    },
    {
      types: ["selector", "attr-name", "string", "char", "builtin", "inserted"],
      style: { color: "#a5d6ff" },
    },
    {
      types: ["operator", "entity", "url", "variable"],
      style: { color: "#ff7b72" },
    },
    {
      types: ["atrule", "attr-value", "keyword"],
      style: { color: "#ff7b72" },
    },
    {
      types: ["function", "class-name"],
      style: { color: "#d2a8ff" },
    },
    {
      types: ["regex", "important"],
      style: { color: "#a5d6ff" },
    },
  ],
};

export function SyntaxHighlighter({
  code,
  language,
  showLineNumbers = true,
}: SyntaxHighlighterProps) {
  const prismLanguage = languageMap[language.toLowerCase()] || "plain";

  return (
    <Highlight theme={terminalTheme} code={code} language={prismLanguage}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} text-sm font-mono leading-relaxed overflow-x-auto`}
          style={{ ...style, margin: 0, padding: 0 }}
        >
          {tokens.map((line, i) => {
            const lineProps = getLineProps({ line, key: i });
            return (
              <div
                key={i}
                {...lineProps}
                className="table-row"
                style={lineProps.style}
              >
                {showLineNumbers && (
                  <span className="table-cell pr-4 text-text-tertiary select-none text-right w-[3ch] opacity-50">
                    {i + 1}
                  </span>
                )}
                <span className="table-cell">
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token, key })} />
                  ))}
                </span>
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}
