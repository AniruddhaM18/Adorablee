"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PinContainer } from "../ui/3d-pin";
import { CanvasRevealEffect } from "./canvas-reveal-effect";

export default function Highlight() {
  const [hovered, setHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`relative z-10 max-w-[96rem] mx-auto px-4 mt-24
        transition-all duration-1000 ease-out 
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
    >
      {/* 👇 INNER PARENT WRAPPED */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="
          relative overflow-hidden
          bg-neutral-950
          rounded-[3rem]
          px-12 md:px-16
          py-24 md:py-28
          min-h-180
          shadow-md
        "
      >
        {/* Canvas reveal */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0"
            >
              <CanvasRevealEffect
                animationSpeed={5}
                containerClassName="bg-transparent"
                colors={[
[229, 229, 229], // neutral-200
  [115, 115, 115], // neutral-500

                ]}
                opacities={[0.2, 0.2, 0.2, 0.2, 0.2, 0.4, 0.4, 0.4, 0.4, 1]}
                dotSize={2}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Radial fade */}
        <div className="absolute inset-0 z-0 [mask-image:radial-gradient(500px_at_center,white,transparent)] bg-black/60" />

        {/* Content */}
        <div className="relative z-10 flex flex-col xl:flex-row items-center justify-center gap-24 ">
          {/* Card 1 */}
          <PinContainer title="Trainded on latest data" href="https://ui.aceternity.com">
            <div className="flex flex-col p-6 tracking-tight text-slate-100/50 w-[22rem] h-[26rem]">
              <h3 className="font-bold text-lg text-slate-100">
                Adorable Models
              </h3>
              <p className="text-slate-500 mt-2">
                Motion-first Tailwind components built for modern React apps.
              </p>
              <div className="flex-1 rounded-xl mt-6 bg-gradient-to-br from-neutral-900/7- via-neutral-800/60 to-neutral-950/-" />
            </div>
          </PinContainer>

          {/* Card 2 */}
          <PinContainer title="Cloudflare Pages" href="https://pages.cloudflare.com">
            <div className="flex flex-col p-6 tracking-tight text-slate-100/50 w-[22rem] h-[26rem]">
              <h3 className="font-bold text-lg text-slate-100">
                Cloudflare Pages
              </h3>
              <p className="text-slate-500 mt-2">
                Free, global, edge-hosted deployments for Vite & React sites.
              </p>
              <div className="flex-1 rounded-xl mt-6 bg-gradient-to-br from-zinc-900/70 via-neutral-900 to-zinc-900/60" />
            </div>
          </PinContainer>

          {/* Card 3 */}
          <PinContainer title="Developer Velocity" href="https://vercel.com">
            <div className="flex flex-col p-6 tracking-tight text-slate-100/50 w-[22rem] h-[26rem]">
              <h3 className="font-bold text-lg text-slate-100">
                Fast Iteration
              </h3>
              <p className="text-slate-500 mt-2">
                Ship faster with previews, CI-ready builds, and edge caching.
              </p>
              <div className="flex-1 rounded-xl mt-6 bg-gradient-to-br from-neutral-950/7- via-neutral-800/60 to-neutral-950/-" />
            </div>
          </PinContainer>
        </div>
      </div>
    </section>
  );
}
