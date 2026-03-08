"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import { ChatSidebar } from "@/src/components/ChatSidebar";
import { ViewSelector } from "@/src/components/ViewSelector";
import { NEXT_PUBLIC_BACKEND_URL } from "@/config";

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
  const createProjectStartedRef = useRef(false);

  // Create project via SSE stream when in creating mode (only once)
  useEffect(() => {
    if (!isCreatingMode) return;
    if (createProjectStartedRef.current) return;
    createProjectStartedRef.current = true;

    const prompt = searchParams.get("prompt");
    if (!prompt) {
      createProjectStartedRef.current = false;
      router.push("/");
      return;
    }

    const createProject = async () => {
      try {
        const res = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/project/create-stream`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
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

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === "log" && event.message) {
                  setCreateLogLines((prev) => [...prev, event.message]);
                } else if (event.type === "project" && event.projectId) {
                  router.replace(`/playground/${event.projectId}`);
                  return;
                } else if (event.type === "error" && event.message) {
                  setError(event.message);
                  setIsCreating(false);
                  return;
                }
              } catch (_) {}
            }
          }
        }
        setError("No project returned");
        setIsCreating(false);
      } catch (err) {
        console.error("Create error:", err);
        setError("Network error");
        setIsCreating(false);
      }
    };

    createProject();
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

  return (
    <div>
      <ChatSidebar
        projectId={actualProjectId || "creating"}
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
