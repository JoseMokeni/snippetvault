import { Variable } from "lucide-react";

interface VariableEditorProps {
  variables: Array<{
    id: string;
    name: string;
    defaultValue: string | null;
    description: string | null;
  }>;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  readOnly?: boolean;
}

export function VariableEditor({
  variables,
  values,
  onChange,
  readOnly = false,
}: VariableEditorProps) {
  if (variables.length === 0) return null;

  const handleChange = (name: string, value: string) => {
    onChange({ ...values, [name]: value });
  };

  const handleReset = (name: string, defaultValue: string | null) => {
    onChange({ ...values, [name]: defaultValue || "" });
  };

  return (
    <div className="terminal-block rounded-lg p-6">
      <div className="space-y-4">
        {variables.map((variable) => (
          <div key={variable.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-display font-semibold text-text-primary">
                <span className="text-syntax-variable">{`{{${variable.name}}}`}</span>
              </label>
              {!readOnly &&
                variable.defaultValue &&
                values[variable.name] !== variable.defaultValue && (
                  <button
                    onClick={() =>
                      handleReset(variable.name, variable.defaultValue)
                    }
                    className="text-xs text-text-tertiary hover:text-accent transition-colors"
                  >
                    Reset
                  </button>
                )}
            </div>
            {variable.description && (
              <p className="text-xs text-text-tertiary">
                {variable.description}
              </p>
            )}
            {readOnly ? (
              <div className="bg-bg-secondary border border-border px-3 py-2 text-sm font-display">
                {values[variable.name] || variable.defaultValue || "(empty)"}
              </div>
            ) : (
              <input
                type="text"
                value={values[variable.name] ?? variable.defaultValue ?? ""}
                onChange={(e) => handleChange(variable.name, e.target.value)}
                placeholder={variable.defaultValue || "Enter value..."}
                className="w-full bg-bg-secondary border border-border px-3 py-2 text-sm font-display text-text-primary focus:border-accent focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Variable form for creating/editing variables in snippet form
interface VariableFormProps {
  variables: Array<{
    id?: string;
    name: string;
    defaultValue: string;
    description: string;
  }>;
  onChange: (
    variables: Array<{
      id?: string;
      name: string;
      defaultValue: string;
      description: string;
    }>
  ) => void;
}

export function VariableForm({ variables, onChange }: VariableFormProps) {
  const handleAdd = () => {
    onChange([...variables, { name: "", defaultValue: "", description: "" }]);
  };

  const handleRemove = (index: number) => {
    onChange(variables.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: string, value: string) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Variable size={16} className="text-accent" />
          <h3 className="font-display font-bold">Variables</h3>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="text-sm text-accent hover:text-accent-hover transition-colors"
        >
          + Add Variable
        </button>
      </div>

      {variables.length === 0 ? (
        <p className="text-sm text-text-tertiary">
          No variables defined. Use{" "}
          <code className="text-syntax-variable">{`{{VARIABLE_NAME}}`}</code> in
          your code to create placeholders.
        </p>
      ) : (
        <div className="space-y-4">
          {variables.map((variable, index) => (
            <div
              key={index}
              className="terminal-block rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-tertiary font-display">
                  Variable {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="text-xs text-error hover:text-error/80 transition-colors"
                >
                  Remove
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-text-secondary mb-1 font-display">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={variable.name}
                    onChange={(e) =>
                      handleChange(
                        index,
                        "name",
                        e.target.value.toUpperCase().replace(/\s+/g, "_")
                      )
                    }
                    placeholder="VARIABLE_NAME"
                    className="w-full bg-bg-secondary border border-border px-3 py-2 text-sm font-display text-text-primary focus:border-accent focus:outline-none"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1 font-display">
                    Default Value
                  </label>
                  <input
                    type="text"
                    value={variable.defaultValue}
                    onChange={(e) =>
                      handleChange(index, "defaultValue", e.target.value)
                    }
                    placeholder="default value"
                    className="w-full bg-bg-secondary border border-border px-3 py-2 text-sm font-display text-text-primary focus:border-accent focus:outline-none"
                    maxLength={500}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1 font-display">
                  Description
                </label>
                <input
                  type="text"
                  value={variable.description}
                  onChange={(e) =>
                    handleChange(index, "description", e.target.value)
                  }
                  placeholder="What is this variable for?"
                  className="w-full bg-bg-secondary border border-border px-3 py-2 text-sm font-display text-text-primary focus:border-accent focus:outline-none"
                  maxLength={200}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
