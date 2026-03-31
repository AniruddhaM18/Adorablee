"use client";

import Link from "next/link";
import { CardSpotlight } from "./card-spotlight";


export function CardSpotlightSection() {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <GenerateCard />
        <PreviewCard />
        <DeployCard />
      </div>
    </div>
  );
}

function GenerateCard() {
  return (
    <CardSpotlight className="min-h-96 w-full flex flex-col justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 relative z-20">
          From idea to repo
        </p>
        <h3 className="text-xl font-bold text-white relative z-20 mt-2">
          Describe and generate
        </h3>

        <p className="text-neutral-300 text-sm mt-4 relative z-20 leading-relaxed">
          Describe your app in plain language—the agent builds structure and files
          so you skip boilerplate before the first preview.
        </p>
      </div>

      <div className="flex flex-1 min-h-0 flex-col justify-end relative z-20">
        <ul className="space-y-2">
          <Step title="Describe your app idea" />
          <Step title="Get generated files and structure" />
          <Step title="Saved as a project you can reopen" />
        </ul>
      </div>
    </CardSpotlight>
  );
}


function PreviewCard() {
  return (
    <CardSpotlight className="min-h-96 w-full flex flex-col justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 relative z-20">
          See it running
        </p>
        <h3 className="text-xl font-bold text-white relative z-20 mt-2">
          Preview and refine
        </h3>

        <p className="text-neutral-300 text-sm mt-4 relative z-20 leading-relaxed">
          Sandbox preview, in-browser editing, and chat in one place—iterate until
          it matches what you want.
        </p>
      </div>

      <div className="flex flex-1 min-h-0 flex-col justify-end relative z-20">
        <ul className="space-y-2">
          <Step title="Live preview from an isolated sandbox" />
          <Step title="Edit code in the browser" />
          <Step title="Chat with the agent to refine the app" />
        </ul>
      </div>
    </CardSpotlight>
  );
}

function DeployCard() {
  return (
    <CardSpotlight className="min-h-96 w-full flex flex-col justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 relative z-20">
          Go live
        </p>
        <h3 className="text-xl font-bold text-white relative z-20 mt-2">
          Ship to the web
        </h3>

        <p className="text-neutral-300 text-sm mt-4 relative z-20 leading-relaxed">
          Connect Cloudflare once, then deploy from the workspace—no zips or extra
          CLIs.
        </p>

        <ul className="mt-6 space-y-2 relative z-20 list-none pl-0">
          <Feature text="Deploy from the product UI" />
          <Feature text="HTTPS hosting on Cloudflare Pages" />
          <Feature text="Edge delivery and version history as you iterate" />
        </ul>
      </div>

      <Link
        href="/auth/signup"
        className="relative z-20 mt-8 flex w-full items-center justify-center rounded-lg bg-neutral-700/60 py-3 text-white font-medium hover:bg-neutral-500/40 transition"
      >
        Get started
      </Link>
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

function Feature({ text }: { text: string }) {
  return <li className="text-neutral-200">• {text}</li>;
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
