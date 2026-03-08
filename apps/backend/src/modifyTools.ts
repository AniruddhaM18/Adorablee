import { z } from "zod";
import { tool } from "@langchain/core/tools";



type FileChange = {
  path: string;
  content: string;
  action: "create" | "modify" | "delete";
};


function normalizeFileContent(content: string): string {
  if (typeof content !== "string") return "";
  if (content.includes("\\n")) {
    return content.replace(/\\n/g, "\n").replace(/\\"/g, '"');
  }
  return content;
}

/// modify_app tool - for editing existing projects
const fileChangeSchema = z.object({
  path: z.string().describe("The file path relative to project root"),
  content: z.string().describe("The new file content (full file content for create/modify, empty for delete)"),
  action: z.enum(["create", "modify", "delete"]).describe("The action to perform on this file"),
});

export const modifyTool = tool(
  async ({ files }) => {
    console.log("Tool Invoked: modify_app");

    if (!Array.isArray(files)) {
      return { files: [], success: false };
    }

    const normalizedFiles: FileChange[] = files.map((f: any) => ({
      path: f.path,
      content: f.action === "delete" ? "" : normalizeFileContent(f.content),
      action: f.action || "modify",
    }));

    console.log(`Processing ${normalizedFiles.length} file changes`);

    return {
      success: true,
      files: normalizedFiles,
    };
  },
  {
    name: "modify_app",
    description:
      "Modify, create, or delete files in an existing project. Use this to implement user's requested changes. Always output the COMPLETE file content for create/modify actions.",
    schema: z.object({
      files: z.array(fileChangeSchema).describe("List of file changes to apply"),
    }),
  }
);

export type { FileChange };
