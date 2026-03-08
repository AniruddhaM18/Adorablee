"use client";

import { useMotionValue, motion, useMotionTemplate } from "motion/react";
import React, {
  MouseEvent as ReactMouseEvent,
  useState,
  forwardRef,
} from "react";
import { cn } from "@/lib/utils";
import { CanvasRevealEffect } from "./canvas-reveal-effect";

type CardSpotlightProps = {
  radius?: number;
  color?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export const CardSpotlight = forwardRef<
  HTMLDivElement,
  CardSpotlightProps
>(function CardSpotlight(
  { children, radius = 350, color = "#1e3a8a", className, ...props },  //original color - "#262626"
  ref
) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: ReactMouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      ref={ref} // ref is now supported
      className={cn(
        "group/spotlight p-10 rounded-md relative border border-neutral-800 bg-black dark:border-neutral-800",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute z-0 -inset-px rounded-lg opacity-0 transition duration-300 group-hover/spotlight:opacity-100"
        style={{
          backgroundColor: color,
          maskImage: useMotionTemplate`
            radial-gradient(
              ${radius}px circle at ${mouseX}px ${mouseY}px,
              white,
              transparent 80%
            )
          `,
        }}
      >
        {isHovering && (
          <CanvasRevealEffect
            animationSpeed={5}
            containerClassName="bg-transparent absolute inset-0 pointer-events-none"
            colors={[
  [163, 163, 163], // neutral-400
  [82, 82, 82],    // neutral-600
  [38, 38, 38],    // neutral-800

            ]}
            dotSize={3}
          />
        )}
      </motion.div>

      {children}
    </div>
  );
});
