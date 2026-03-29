"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ChatSidebar } from "@/src/components/ChatSidebar";
import { ViewSelector } from "@/src/components/ViewSelector";
import { NEXT_PUBLIC_BACKEND_URL } from "@/config";
import { toast } from "sonner";

const SETTINGS_TOAST_CODES = new Set([
  "FREE_PROJECT_LIMIT_REACHED",
  "OPENROUTER_INSUFFICIENT_CREDITS",
  "OPENROUTER_KEY_REQUIRED",
]);

function PlaygroundContent() {
  const params = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  // "creating" is a special value meaning we need to create the project first
  const urlProjectId = params.projectId;
  const isCreatingMode = urlProjectId === "creating";

  const [actualProjectId, setActualProjectId] = useState<string | null>(
    isCreatingMode ? null : urlProjectId
  );
  const [files, setFiles] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!isCreatingMode);
  const [isCreating, setIsCreating] = useState(isCreatingMode);
  const [error, setError] = useState<string | null>(null);
  const [createLogLines, setCreateLogLines] = useState<string[]>([]);

  // Create project via SSE stream when in creating mode
  useEffect(() => {
    if (!isCreatingMode) return;

    const prompt = searchParams.get("prompt");
    const model = searchParams.get("model") ?? undefined;
    if (!prompt) {
      router.push("/");
      return;
    }

    const abortController = new AbortController();
    const { signal } = abortController;

    const parseSseDataPayload = (rawLine: string) => {
      const line = rawLine.replace(/\r$/, "").trimEnd();
      if (!line.startsWith("data: ")) return null;
      const json = line.slice(6).trim();
      try {
        return JSON.parse(json) as {
          type?: string;
          message?: string;
          projectId?: string;
          code?: string;
        };
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[create-stream] SSE data line JSON parse failed", e);
        }
        return null;
      }
    };

    /** Returns true if the caller should stop (navigated, error shown, or terminal event). */
    const handleSseEvent = (event: NonNullable<ReturnType<typeof parseSseDataPayload>>) => {
      if (event.type === "log" && event.message != null && event.message !== "") {
        const logLine = event.message;
        setCreateLogLines((prev) => [...prev, logLine]);
        return false;
      }
      if (event.type === "project" && event.projectId) {
        const modelParam = searchParams.get("model");
        const suffix =
          modelParam != null && modelParam !== ""
            ? `?model=${encodeURIComponent(modelParam)}`
            : "";
        router.replace(`/playground/${event.projectId}${suffix}`);
        return true;
      }
      if (event.type === "error") {
        const msg = event.message || "Something went wrong, please try again.";
        if (event.code && SETTINGS_TOAST_CODES.has(event.code)) {
          toast.error("Add your OpenRouter API key in Settings to continue.", {
            description: msg,
            duration: 14_000,
            action: {
              label: "Open Settings",
              onClick: () => router.push("/settings"),
            },
          });
        }
        setError(msg);
        setIsCreating(false);
        return true;
      }
      return false;
    };

    const createProject = async () => {
      let streamDone = false;
      try {
        const res = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/project/create-stream`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, model }),
          signal,
        });

        if (res.status === 401) {
          router.push("/auth/signup");
          return;
        }

        if (!res.ok || !res.body) {
          setError("Failed to start project creation");
          setIsCreating(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const flushLine = (line: string) => {
          const event = parseSseDataPayload(line);
          return event ? handleSseEvent(event) : false;
        };

        while (!signal.aborted) {
          const { done, value } = await reader.read();
          if (value) {
            buffer += decoder.decode(value, { stream: !done });
          }
          if (done) {
            streamDone = true;
            for (const line of buffer.split("\n")) {
              if (flushLine(line)) return;
            }
            break;
          }
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (flushLine(line)) return;
          }
        }

        if (!signal.aborted && streamDone) {
          setError("No project returned");
          setIsCreating(false);
        }
      } catch (err) {
        if (signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("Create error:", err);
        setError("Network error");
        setIsCreating(false);
      }
    };

    createProject();
    return () => abortController.abort();
  }, [isCreatingMode, searchParams, router]);

  // Fetch project data only when we have a real projectId
  useEffect(() => {
    if (!actualProjectId || isCreating) return;

    setIsLoading(true);
    fetch(`${NEXT_PUBLIC_BACKEND_URL}/project/${actualProjectId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.project?.currentVersion?.files) {
          setFiles(data.project.currentVersion.files);
        }
        if (data.project?.previewUrl) {
          setPreviewUrl(data.project.previewUrl);
        }
        if (data.project?.deployedUrl) {
          setDeployedUrl(data.project.deployedUrl);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch project:", err);
        setIsLoading(false);
      });
  }, [actualProjectId, isCreating]);

  const handleFilesUpdate = (newFiles: any) => {
    setFiles(newFiles);
  };

  if (error) {
    return (
      <div className="h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const chatModelKey = searchParams.get("model") ?? undefined;

  return (
    <div>
      <ChatSidebar
        projectId={actualProjectId || "creating"}
        modelKey={chatModelKey}
        onFilesUpdate={handleFilesUpdate}
      />
      <ViewSelector
        projectId={actualProjectId || "creating"}
        files={files}
        previewUrl={previewUrl}
        deployedUrl={deployedUrl}
        isLoading={isLoading}
        isCreating={isCreating}
        createLogLines={createLogLines}
      />
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-neutral-950" />}>
      <PlaygroundContent />
    </Suspense>
  );
}
