import { FileTreeNode } from "@/components/ui/file-tree";

// =====================
// Handles flat object: {"src/App.jsx": "content...", "index.html": "content..."}
// =====================

export function buildFileTree(
  files: Record<string, any>
): FileTreeNode[] {
  const root: Record<string, any> = {};

  // Build nested structure from flat paths
  for (const [filePath, content] of Object.entries(files)) {
    const parts = filePath.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        // It's a file - store the content directly
        current[part] = {
          type: "file",
          content: typeof content === "string" ? content : content.content || "",
        };
      } else {
        // It's a folder - ensure it exists
        if (!current[part] || current[part].type !== "folder") {
          current[part] = {
            type: "folder",
            children: {},
          };
        }
        current = current[part].children;
      }
    }
  }

  // Convert nested structure to tree nodes
  function toTreeNodes(obj: Record<string, any>, prefix = ""): FileTreeNode[] {
    return Object.entries(obj).map(([name, node]) => {
      const id = prefix ? `${prefix}/${name}` : name;

      if (node.type === "folder") {
        return {
          id,
          name,
          type: "folder",
          children: toTreeNodes(node.children, id),
        };
      }

      return {
        id,
        name,
        type: "file",
      };
    });
  }

  return toTreeNodes(root);
}

export function getFileByPath(
  files: Record<string, any>,
  path: string[]
): { type: string; content: string } | null {
  // First, try direct lookup for flat structure
  const fullPath = path.join("/");
  
  if (files[fullPath] !== undefined) {
    const content = files[fullPath];
    return {
      type: "file",
      content: typeof content === "string" ? content : content.content || "",
    };
  }

  // Fallback: try nested navigation (in case structure changes later)
  let current: any = files;

  for (const segment of path) {
    if (!current) return null;

    current = current[segment];
    
    if (!current) return null;

    // If it's a folder node, navigate into children
    if (current.type === "folder" && current.children) {
      current = current.children;
    }
  }

  if (current && (current.type === "file" || typeof current === "string")) {
    return {
      type: "file",
      content: typeof current === "string" ? current : current.content || "",
    };
  }

  return null;
}