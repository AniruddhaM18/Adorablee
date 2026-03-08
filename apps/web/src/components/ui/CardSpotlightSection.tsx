"use client";

import { CardSpotlight } from "./card-spotlight";


export function CardSpotlightSection() {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <AuthCard />
        <AnalyticsCard />
        <DeployCard />
      </div>
    </div>
  );
}

function AuthCard() {
  return (
    <CardSpotlight className="h-96 w-full">
      <h3 className="text-xl font-bold text-white relative z-20">
        Authentication
      </h3>

      <p className="text-neutral-300 mt-4 relative z-20">
        Secure your account in minutes.
      </p>

      <ul className="mt-12 space-y-2 relative z-20">
        <Step title="Enter email address" />
        <Step title="Create a strong password" />
        <Step title="Enable two-factor authentication" />
        <Step title="Verify your identity" />
      </ul>
    </CardSpotlight>
  );
}


function AnalyticsCard() {
  return (
    <CardSpotlight className="h-96 w-full">
      <h3 className="text-xl font-bold text-white relative z-20">
        Analytics
      </h3>

      <p className="text-neutral-300 mt-2 relative z-20">
        Real-time insights that drive growth.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 relative z-20">
        <Stat label="Visitors" value="124K" />
        <Stat label="Conversion" value="4.8%" />
        <Stat label="Bounce Rate" value="32%" />
        <Stat label="Revenue" value="$12.4K" />
      </div>
    </CardSpotlight>
  );
}

function DeployCard() {
  return (
    <CardSpotlight className="h-96 w-full flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-bold text-white relative z-20">
          One-click Deploy
        </h3>

        <p className="text-neutral-300 mt-3 relative z-20">
          Launch globally in seconds with edge-first infrastructure.
        </p>

        <ul className="mt-6 space-y-3 relative z-20">
          <Feature text="Cloudflare edge hosting" />
          <Feature text="Automatic SSL & CDN" />
          <Feature text="Instant rollbacks" />
        </ul>
      </div>

      <button className="relative z-20 mt-6 w-full rounded-lg bg-neutral-700/60 py-3 text-white font-medium hover:bg-neutral-500/40 transition">
        Deploy now
      </button>
    </CardSpotlight>
  );
}

export function Step({ title }: { title: string }) {
  return (
    <li className="flex gap-2 items-start">
      <CheckIcon />
      <p className="text-white">{title}</p>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-4">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return <p className="text-neutral-200">• {text}</p>;
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4 text-blue-500/50 mt-1 shrink-0"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm2.293 7.293a1 1 0 0 1 1.497 1.32l-.083.094-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 1 1 1.414-1.414l1.293 1.293 3.293-3.293z" />
    </svg>
  );
}
