"use client";

import Editor from "@monaco-editor/react";

export default function CodeEditor({
  value,
  language,
  path,
}: {
  value: string;
  language: string;
  path: string;
}) {
  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Define custom dark theme with enhanced syntax highlighting
    monaco.editor.defineTheme('adorable-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // Keywords (if, else, return, const, let, etc.)
        { token: 'keyword', foreground: 'FF6AC1', fontStyle: 'bold' },

        // Strings
        { token: 'string', foreground: 'FFD580' },

        // Comments
        { token: 'comment', foreground: '7FBA00', fontStyle: 'italic' },

        // Numbers
        { token: 'number', foreground: '00E8C6' },

        // Functions
        { token: 'function', foreground: 'FFE66D' },

        // Variables
        { token: 'variable', foreground: '80D4FF' },

        // Types
        { token: 'type', foreground: '5AFFB0' },

        // Operators
        { token: 'operator', foreground: 'D4D4D4' },

        // JSX/TSX tags
        { token: 'tag', foreground: '6E9EFF' },

        // Properties
        { token: 'property', foreground: 'C792EA' },

        // Classes
        { token: 'class', foreground: 'FF9B50' },

        // Constants
        { token: 'constant', foreground: 'FF5370' },
      ],
      colors: {
        'editor.background': '#0a0a0a',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#4a4a4a',
        'editorLineNumber.activeForeground': '#C792EA',
        'editor.selectionBackground': '#4D7FFF80',
        'editor.inactiveSelectionBackground': '#8B5CF680',
        'editorCursor.foreground': '#FF6AC1',
        'editor.lineHighlightBorder': '#0a0a0a',
        'editor.lineHighlightBackground': '#1a1a2e40',
        'editorIndentGuide.background': '#2a2a3a',
        'editorIndentGuide.activeBackground': '#8B5CF6',
      }
    });
    monaco.editor.setTheme('adorable-dark');
  };

  return (
    <div className="h-full w-full overflow-hidden border border-zinc-800/50">
      <Editor
        key={path}                 // FORCE MODEL CHANGE
        path={path}               //MONACO FILE ID
        height="100%"
        value={value}
        language={language}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          readOnly: true,
          domReadOnly: true,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          cursorStyle: "line-thin",
          renderLineHighlight: "none",
          lineNumbers: "on",
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}
