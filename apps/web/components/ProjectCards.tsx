"use client";

import { CardSpotlight } from "@/src/components/ui/card-spotlight";
import { FaRegTrashAlt } from "react-icons/fa";
import { MdArrowOutward } from "react-icons/md";
import { useRef, useState, useEffect } from "react";

const DESKTOP_VIEWPORT = { width: 1280, height: 720 };

interface ProjectCardProps {
  id: string;
  name: string;
  deployedUrl?: string;
  previewUrl?: string;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
}

export default function ProjectCard({ id, name, deployedUrl, previewUrl, onDelete, onClick }: ProjectCardProps) {
  // Only show iframe for deployed projects
  const displayUrl = deployedUrl;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  useEffect(() => {
    if (!displayUrl || !viewportRef.current) return;
    const el = viewportRef.current;
    const updateScale = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const s = Math.min(w / DESKTOP_VIEWPORT.width, h / DESKTOP_VIEWPORT.height);
      setScale(s);
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [displayUrl]);

  return (
    <div
      className="
        group relative h-[320px] w-full rounded-lg
        bg-neutral-950
        transition-all duration-300
        hover:shadow-[0_0_50px_rgba(255,255,255,0.06)]
        cursor-pointer
      "
      onClick={() => onClick(id)}
    >
      <CardSpotlight className="h-full w-full rounded-md">
        <div className="relative z-20 h-full w-full rounded-md bg-neutral-950 flex flex-col overflow-hidden">

          {/* Browser window / eyeframe */}
          <div
            className="
              flex-1 min-h-[200px] rounded-md
              bg-neutral-900
              border border-white/10
              overflow-hidden
              transition-all duration-300
              group-hover:-translate-y-1
              group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.85)]
              mx-1 mt-1
              flex flex-col
            "
          >
            {/* Title bar with traffic lights */}
            <div className="flex items-center gap-2 px-3 py-2 bg-neutral-950 border-b border-white/5 shrink-0">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
            </div>

            {/* Viewport area: render at desktop size then scale to fit so content looks like full browser */}
            {displayUrl ? (
              <div
                ref={viewportRef}
                className="flex-1 min-h-[140px] w-full overflow-hidden bg-neutral-900 relative"
              >
                <div
                  className="absolute top-0 left-0"
                  style={{
                    width: DESKTOP_VIEWPORT.width,
                    height: DESKTOP_VIEWPORT.height,
                    transform: `scale(${scale})`,
                    transformOrigin: "0 0",
                  }}
                >
                  <iframe
                    src={displayUrl}
                    style={{ width: DESKTOP_VIEWPORT.width, height: DESKTOP_VIEWPORT.height }}
                    className="border-0 block"
                    sandbox="allow-scripts allow-same-origin"
                    loading="lazy"
                    title={`Preview of ${name}`}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-[140px] p-4 flex flex-col">
                <div className="h-28 w-full rounded-md bg-neutral-800/70 shrink-0" />
                <div className="mt-4 h-3 w-1/2 rounded-full bg-neutral-700/60" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
            <p className="text-sm font-medium text-neutral-300 line-clamp-1">
              {name}
            </p>

            <div className="flex items-center gap-2 text-neutral-500">
              <button
                className="hover:text-red-400 transition p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
              >
                <FaRegTrashAlt size={14} />
              </button>
              <button
                className="hover:text-neutral-300 transition p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(id);
                }}
              >
                <MdArrowOutward size={14} />
              </button>
            </div>
          </div>

        </div>
      </CardSpotlight>
    </div>
  );
}
