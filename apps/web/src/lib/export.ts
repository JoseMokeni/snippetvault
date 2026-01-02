import JSZip from "jszip";

interface FileData {
  filename: string;
  content: string;
}

interface Variable {
  name: string;
  defaultValue?: string | null;
}

/**
 * Substitute variables in content using {{variableName}} syntax
 */
export function substituteVariables(
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

/**
 * Export snippet files as a ZIP archive with variables substituted
 */
export async function exportAsZip(
  files: FileData[],
  variables: Variable[],
  variableValues: Record<string, string>
): Promise<Blob> {
  const zip = new JSZip();

  for (const file of files) {
    const content = substituteVariables(
      file.content,
      variables,
      variableValues
    );
    zip.file(file.filename, content);
  }

  return zip.generateAsync({ type: "blob" });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Export all files as a single text with separators
 */
export function exportAsText(
  files: FileData[],
  variables: Variable[],
  variableValues: Record<string, string>
): string {
  return files
    .map((file) => {
      const content = substituteVariables(
        file.content,
        variables,
        variableValues
      );
      return `// ============ ${file.filename} ============\n\n${content}`;
    })
    .join("\n\n");
}
