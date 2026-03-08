"use client";

import { useMemo, useState } from "react";
import CodeEditor from "./CodeEditor";
import { buildFileTree, getFileByPath } from "@/lib/file-utils";
import { FileTree } from "@/components/ui/file-tree";

type CodeSandboxProps = {
  files: any;
};

export function CodeSandbox({ files }: CodeSandboxProps) {
  const [editorValue, setEditorValue] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [activePath, setActivePath] = useState("");

  const treeData = useMemo(() => {
    if (!files) return [];
    return buildFileTree(files);
  }, [files]);

  const onOpenFile = (id: string) => {
    if (!files) return;

    const cleanPath = id.startsWith("root/")
      ? id.replace("root/", "")
      : id;

    const pathArray = cleanPath.split("/");
    const file = getFileByPath(files, pathArray);

    if (!file) return;

    setEditorValue(file.content);
    setLanguage(detectLanguage(cleanPath));
    setActivePath(cleanPath);
  };

  return (
    <div className="h-full bg-neutral-900">
      <div className="flex h-full w-full rounded-md  bg-neutral-800">
        <div className="w-[220px] h-full border-r border-neutral-600">
          <FileTree data={treeData} onFileSelect={onOpenFile} />
        </div>

        <div className="flex-1 h-full">
          {activePath ? (
            <CodeEditor
              value={editorValue}
              language={language}
              path={activePath}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500">
              Select a file to view
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function detectLanguage(path: string) {
  if (path.endsWith(".js")) return "javascript";
  if (path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".md")) return "markdown";
  return "plaintext";
}