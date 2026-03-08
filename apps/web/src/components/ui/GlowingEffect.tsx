"use client";

import { Box, Lock, Search, Settings, Sparkles } from "lucide-react";
import { GlowingEffect } from "./glowing-effect"; // Use the FIXED component

export function GlowingEffectDemoSecond() {
  return (
    <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
      <GridItem
        area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
        icon={<Box className="h-4 w-4 text-neutral-400" />}
        title="Do things the right way"
        description="Running out of copy so I'll write anything."
      />

      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
        icon={<Settings className="h-4 w-4 text-neutral-400" />}
        title="The best AI code generator ever."
        description="Yes, it's true. I'm not even kidding. Ask my mom if you don't believe me."
      />

      <GridItem
        area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
        icon={<Lock className="h-4 w-4 text-neutral-400" />}
        title="Build things the Adorable way,built by Aniruddha"
        description="Powered by Openrouter"
      />

      <GridItem
        area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
        icon={<Sparkles className="h-4 w-4 text-neutral-400" />}
        title="This card is also built by Adorable"
        description="I'm not even kidding. Ask my mom if you don't believe me."
      />

      <GridItem
        area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
        icon={<Search className="h-4 w-4 text-neutral-400" />}
        title="API features coming soon"
        description="I'm writing the code as I record this, no shit."
      />
    </ul>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      {/* Outer container with glowing effect */}
      <div className="group relative h-full rounded-2xl bg-neutral-800/30 p-[1px] md:rounded-3xl backdrop-blur-sm">
        {/* THE GLOWING EFFECT */}
        <GlowingEffect
          blur={0}
          borderWidth={1}
          spread={80}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        
        {/* Middle layer - creates the gap/padding effect */}
        <div className="relative h-full rounded-2xl bg-neutral-950/50 p-2 md:rounded-3xl md:p-3">
          {/* Inner card with neumorphic shadow */}
          <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl bg-neutral-900/40 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_1px_3px_0_rgba(0,0,0,0.3)] md:p-6 backdrop-blur-sm">
            <div className="relative flex flex-1 flex-col justify-between gap-3">
              {/* Icon container */}
              <div className="w-fit rounded-lg border border-neutral-700/50 bg-neutral-800/50 p-2 shadow-sm backdrop-blur-sm">
                {icon}
              </div>
              
              {/* Text content */}
              <div className="space-y-3">
                <h3 className="font-sans text-xl/[1.375rem] font-semibold text-white md:text-2xl/[1.875rem]">
                  {title}
                </h3>
                <h2 className="font-sans text-sm/[1.125rem] text-neutral-400 md:text-base/[1.375rem]">
                  {description}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};