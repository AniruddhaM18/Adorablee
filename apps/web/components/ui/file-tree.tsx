"use client";

import {
  ControlledTreeEnvironment,
  Tree,
  TreeItem,
  TreeItemIndex,
} from "react-complex-tree";
import { useMemo, useState } from "react";
import {
  FaChevronDown,
  FaChevronRight,
  FaFolder,
  FaFolderOpen,
} from "react-icons/fa";
import {
  SiJavascript,
  SiTypescript,
  SiReact,
  SiCss3,
  SiHtml5,
  SiMarkdown,
} from "react-icons/si";
import { FaNodeJs } from "react-icons/fa6";
import { VscFile } from "react-icons/vsc";

// =====================
// Types
// =====================
export type FileTreeNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
};

type FileTreeProps = {
  data: FileTreeNode[];
  onFileSelect?: (id: string) => void;
};

// =====================
// File Icon Helper
// =====================
function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'js':
      return { icon: SiJavascript, color: 'text-yellow-400' };
    case 'jsx':
      return { icon: SiReact, color: 'text-cyan-400' };
    case 'ts':
      return { icon: SiTypescript, color: 'text-blue-400' };
    case 'tsx':
      return { icon: SiReact, color: 'text-blue-400' };
    case 'css':
    case 'scss':
    case 'sass':
      return { icon: SiCss3, color: 'text-pink-400' };
    case 'html':
      return { icon: SiHtml5, color: 'text-orange-400' };
    case 'json':
      return { icon: FaNodeJs, color: 'text-emerald-500' };
    case 'md':
    case 'mdx':
      return { icon: SiMarkdown, color: 'text-gray-400' };
    default:
      return { icon: VscFile, color: 'text-gray-500' };
  }
}

// =====================
// Component
// =====================
export function FileTree({ data, onFileSelect }: FileTreeProps) {
  // Normalize data → react-complex-tree format
  const items = useMemo<Record<TreeItemIndex, TreeItem>>(() => {
    const map: Record<TreeItemIndex, TreeItem> = {
      root: {
        index: "root",
        isFolder: true,
        children: data.map((node) => node.id), // Only add top-level items here
        data: "root",
      },
    };

    const walk = (nodes: FileTreeNode[]) => {
      for (const node of nodes) {
        // Add this node to the map
        map[node.id] = {
          index: node.id,
          isFolder: node.type === "folder",
          children: node.children?.map((c) => c.id) ?? [],
          data: node.name,
        };

        // Recursively process children
        if (node.children && node.children.length > 0) {
          walk(node.children);
        }
      }
    };

    walk(data);
    return map;
  }, [data]);

  // View state
  const [focusedItem, setFocusedItem] = useState<TreeItemIndex>();
  const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([]);
  const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);

  return (
    <div className="h-full w-[220px]  border border-zinc-800/50 bg-[#0a0a0a] text-zinc-300">
      <ControlledTreeEnvironment
        items={items}
        getItemTitle={(item) => String(item.data)}
        viewState={{
          tree: {
            focusedItem,
            expandedItems,
            selectedItems,
          },
        }}
        onFocusItem={(item) => setFocusedItem(item.index)}
        onExpandItem={(item) =>
          setExpandedItems((prev) =>
            prev.includes(item.index) ? prev : [...prev, item.index]
          )
        }
        onCollapseItem={(item) =>
          setExpandedItems((prev) => prev.filter((i) => i !== item.index))
        }
        onSelectItems={(selected) => {
          setSelectedItems(selected);

          const id = selected[0];
          if (!id || id === "root") return;

          const item = items[id];
          if (!item || item.isFolder) return;

          onFileSelect?.(String(id));
        }}
        renderItem={({ item, depth, context, children }) => {
          const fileIconData = !item.isFolder ? getFileIcon(String(item.data)) : null;
          const FileIcon = fileIconData?.icon;

          return (
            <div style={{ paddingLeft: depth * 14 }}>
              <div
                className={`flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer transition-all duration-150
                  ${context.isSelected
                    ? "bg-zinc-600/20 text-white border-l-2 border-zinc-500 ml-[-2px]"
                    : "hover:bg-zinc-800/50"
                  }
                `}
                {...context.interactiveElementProps}
              >
                {/* Arrow */}
                {item.isFolder ? (
                  context.isExpanded ? (
                    <FaChevronDown className="text-zinc-500 text-xs transition-transform" />
                  ) : (
                    <FaChevronRight className="text-zinc-500 text-xs transition-transform" />
                  )
                ) : (
                  <span className="w-3" />
                )}

                {/* Icon */}
                {item.isFolder ? (
                  context.isExpanded ? (
                    <FaFolderOpen className="text-blue-500/90 text-base" />
                  ) : (
                    <FaFolder className="text-blue-400/80 text-base" />
                  )
                ) : FileIcon ? (
                  <FileIcon className={`${fileIconData.color} text-sm`} />
                ) : null}

                {/* Label */}
                <span className="truncate">{item.data}</span>
              </div>

              {children}
            </div>
          );
        }}
      >
        <Tree treeId="tree" rootItem="root" />
      </ControlledTreeEnvironment>
    </div>
  );
}