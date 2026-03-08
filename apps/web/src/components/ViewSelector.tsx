"use client";

import { useState, useEffect } from "react";
import JSZip from "jszip";
import { FaCode } from "react-icons/fa";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CodeSandbox } from "./CodeSandbox";
import { Viewport } from "./ViewPort";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IoMdGlobe } from "react-icons/io";
import { IoReload, IoCheckmark, IoCopyOutline } from "react-icons/io5";
import { MdSmartphone, MdDesktopMac, MdDownload } from "react-icons/md";
import { NEXT_PUBLIC_BACKEND_URL } from "@/config";
// import Loader from "./Loader";
import TerminalLoader from "./termloader";

/** Flatten nested { path: string } or { path: { content: string } } to Record<path, content> for zip */
function flattenFilesForZip(files: any, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (!files || typeof files !== "object") return out;
  for (const [key, value] of Object.entries(files)) {
    const path = prefix ? `${prefix}/${key}` : key;
    if (typeof value === "string") {
      out[path] = value;
    } else if (value && typeof value === "object" && "content" in value && typeof (value as { content: string }).content === "string") {
      out[path] = (value as { content: string }).content;
    } else if (value && typeof value === "object") {
      Object.assign(out, flattenFilesForZip(value, path));
    }
  }
  return out;
}

type ViewSelectorProps = {
  projectId: string;
  files: any;
  previewUrl: string;
  isLoading?: boolean;
  isCreating?: boolean;
  deployedUrl?: string | null;
  /** Live log lines from create-stream SSE (passed to TerminalLoader) */
  createLogLines?: string[];
};

export function ViewSelector({
  projectId,
  files,
  previewUrl,
  isLoading,
  isCreating,
  deployedUrl: initialDeployedUrl,
  createLogLines,
}: ViewSelectorProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(initialDeployedUrl || null);
  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">("desktop");
  const [tooltipText, setTooltipText] = useState("Click to copy");
  const [justCopied, setJustCopied] = useState(false);

  // Sync deployedUrl when prop changes
  useEffect(() => {
    if (initialDeployedUrl) {
      setDeployedUrl(initialDeployedUrl);
    }
  }, [initialDeployedUrl]);

  useEffect(() => {
    if (files) {
      const timer = setTimeout(() => {
        setRefreshKey((prev) => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [files]);

  const handleRefreshPreview = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleCopyUrl = async () => {
    if (deployedUrl) {
      try {
        await navigator.clipboard.writeText(deployedUrl);
        setTooltipText("Copied!");
        setJustCopied(true);
        setTimeout(() => {
          setJustCopied(false);
          setTooltipText("Click to copy");
        }, 1800);
      } catch (err) {
        console.error("Failed to copy URL:", err);
      }
    }
  };

  const handleDownload = async () => {
    if (!files || Object.keys(files).length === 0) {
      alert("No project files to download.");
      return;
    }
    setIsDownloading(true);
    try {
      const flat = flattenFilesForZip(files);
      const zip = new JSZip();
      for (const [path, content] of Object.entries(flat)) {
        zip.file(path, content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${projectId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download error:", err);
      alert(`Download failed: ${err?.message ?? "Unknown error"}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const response = await fetch(
        `${NEXT_PUBLIC_BACKEND_URL}/project/${projectId}/deploy`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.url) {
        setDeployedUrl(data.url);
        window.open(data.url, "_blank");
      } else {
        alert(`Deploy failed: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Deploy error:", error);
      alert(`Deploy failed: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  // Show Loader when creating project — same box as code editor: no rounded, no padding, flush alignment
  if (isCreating) {
    return (
      <div className="h-screen bg-[#0a0a0a] pl-[380px] pt-0 pr-0 pb-0">
        <div className="relative h-full overflow-hidden bg-[#111111]">
          <TerminalLoader logLines={createLogLines} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0a] pl-[380px] pt-0 pr-0 pb-0">
      <Tabs defaultValue="code" className="flex h-full flex-col w-full gap-0">
        {/* Top bar — h-14, consistent rounded and padding */}
        <div className="flex items-center justify-between h-14 px-5 border-b border-neutral-800/50 bg-[#111111]">
          {/* Left - Tab toggle */}
          <TabsList className="h-8 min-w-[7rem] p-0.5 bg-neutral-900 border border-neutral-800 rounded-lg">
            <TabsTrigger
              value="preview"
              className="h-7 px-3 text-xs font-medium data-[state=active]:bg-neutral-800 data-[state=active]:text-white data-[state=inactive]:text-neutral-400 rounded-md transition-colors duration-150"
            >
              Preview
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="h-7 px-3 text-xs font-medium data-[state=active]:bg-neutral-800 data-[state=active]:text-white data-[state=inactive]:text-neutral-400 rounded-md transition-colors duration-150"
            >
              <FaCode className="mr-1.5 h-3.5 w-3.5" /> Code
            </TabsTrigger>
          </TabsList>

          {/* Center - URL bar & viewport controls */}
          <div className="flex items-center gap-2.5 flex-1 max-w-2xl mx-5 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="flex items-center gap-2 h-8 min-h-8 pl-3 pr-2 bg-neutral-900 border border-neutral-800 rounded-lg flex-1 min-w-0 cursor-pointer hover:border-neutral-600/80 transition-colors duration-200"
                    onClick={handleCopyUrl}
                  >
                    <IoMdGlobe className="size-3.5 text-neutral-500 flex-shrink-0" aria-hidden />
                    <span className="flex-1 min-w-0 truncate text-xs text-neutral-400">
                      {deployedUrl || "Deploy to get URL"}
                    </span>
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 transition-colors duration-200">
                      {justCopied ? (
                        <IoCheckmark className="size-4 text-emerald-400" aria-hidden />
                      ) : (
                        <IoCopyOutline className="size-4" aria-hidden />
                      )}
                    </span>
                  </div>
                </TooltipTrigger>
                {deployedUrl && (
                  <TooltipContent sideOffset={4}>
                    <p>{tooltipText}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {/* Viewport controls */}
            <div className="flex items-center gap-0.5 h-8 p-0.5 bg-neutral-900 border border-neutral-800 rounded-lg flex-shrink-0">
              <button
                onClick={() => setViewportMode("desktop")}
                className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors duration-150 ${viewportMode === "desktop"
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
                  }`}
                title="Desktop view"
              >
                <MdDesktopMac className="size-4" />
              </button>
              <button
                onClick={() => setViewportMode("mobile")}
                className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors duration-150 ${viewportMode === "mobile"
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
                  }`}
                title="Mobile view"
              >
                <MdSmartphone className="size-4" />
              </button>
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              className="h-8 w-8 p-0 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg transition-colors duration-150"
              size="sm"
              variant="ghost"
              onClick={handleRefreshPreview}
            >
              <IoReload className="size-4" />
            </Button>
            <Button
              className="h-8 px-3.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-medium text-xs disabled:opacity-40 transition-colors duration-150"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading || !files || Object.keys(files).length === 0}
            >
              {isDownloading ? "Preparing..." : "Download"}
              <MdDownload className="size-4 ml-1.5" />
            </Button>
            <Button
              className="h-8 px-3.5 rounded-lg grad-blue text-white shadow-md font-medium text-xs disabled:opacity-40 hover:opacity-95 active:scale-[0.98] transition-all duration-150"
              size="sm"
              onClick={handleDeploy}
              disabled={isDeploying}
            >
              {isDeploying ? "Deploying..." : "Deploy"}
              <IoMdGlobe className="size-4 ml-1.5" />
            </Button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden bg-[#0a0a0a]">
          <TabsContent value="code" className="h-full m-0 border-0 rounded-none">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
                Loading project files...
              </div>
            ) : (
              <CodeSandbox files={files} />
            )}
          </TabsContent>

          <TabsContent value="preview" className="h-full m-0 border-0 rounded-none">
            <div className="h-full flex flex-col bg-neutral-900">
              {/* Viewport Container */}
              <div className="flex-1 flex items-center justify-center bg-neutral-900 p-1 overflow-auto">
                <div
                  className={`h-full transition-all duration-300 ${viewportMode === "mobile" ? "w-[375px]" : "w-full"
                    }`}
                >
                  <Viewport key={refreshKey} url={previewUrl} />
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

