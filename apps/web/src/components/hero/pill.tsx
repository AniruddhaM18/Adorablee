import { cn } from "@/lib/utils";
import { px } from "./components/utils";

export const Pill = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const polyRoundness = 6
  const hypotenuse = polyRoundness * 2
  const hypotenuseHalf = polyRoundness / 2 - 1.5

  return (
    <div
      style={{
        "--poly-roundness": px(polyRoundness),
      } as React.CSSProperties}
      className={cn("bg-[#262626]/50 transform-gpu font-medium text-foreground/50 backdrop-blur-xs font-mono text-sm relative inline-flex items-center justify-center px-4 h-8 border border-neutral-600/50 [clip-path:polygon(var(--poly-roundness)_0,calc(100%_-_var(--poly-roundness))_0,100%_var(--poly-roundness),100%_calc(100%_-_var(--poly-roundness)),calc(100%_-_var(--poly-roundness))_100%,var(--poly-roundness)_100%,0_calc(100%_-_var(--poly-roundness)),0_var(--poly-roundness))]", className)}
    >
      <span style={{ "--h": px(hypotenuse), "--hh": px(hypotenuseHalf) } as React.CSSProperties} className="absolute inline-block w-[var(--h)] top-[var(--hh)] left-[var(--hh)] h-[2px] -rotate-45 origin-top -translate-x-1/2 bg-neutral-600/50" />
      <span style={{ "--h": px(hypotenuse), "--hh": px(hypotenuseHalf) } as React.CSSProperties} className="absolute w-[var(--h)] top-[var(--hh)] right-[var(--hh)] h-[2px] bg-neutral-600/50 rotate-45 translate-x-1/2" />
      <span style={{ "--h": px(hypotenuse), "--hh": px(hypotenuseHalf) } as React.CSSProperties} className="absolute w-[var(--h)] bottom-[var(--hh)] left-[var(--hh)] h-[2px] bg-neutral-600/50 rotate-45 -translate-x-1/2" />
      <span style={{ "--h": px(hypotenuse), "--hh": px(hypotenuseHalf) } as React.CSSProperties} className="absolute w-[var(--h)] bottom-[var(--hh)] right-[var(--hh)] h-[2px] bg-neutral-600/50 -rotate-45 translate-x-1/2" />

      <span className="relative z-10 inline-block size-2.5 rounded-full bg-yellow-400 mr-2 shadow-[0_0_20px_4px] shadow-yellow-400/20" />
      {children}
    </div>
  );
};