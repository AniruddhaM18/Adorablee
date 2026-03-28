"use client";

import { Plus } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    q: "What is Adorable?",
    a: "Adorable is an AI-assisted builder that helps you ship polished landing pages in minutes instead of days. Describe what you need and iterate with chat-style guidance.",
  },
  {
    q: "How do I get started?",
    a: "Create an account, open a project, and start from the playground. You can refine copy, structure, and styling through prompts until the page matches your brand.",
  },
  {
    q: "Is there a free tier?",
    a: "Yes. The developer plan is available at no charge with core AI completions and chat so you can build and learn without upfront cost.",
  },
  {
    q: "Can I export or own my content?",
    a: "Your projects and generated content are yours. Export and integration options depend on what we expose in the product; check the playground and docs for the latest workflows.",
  },
  {
    q: "How do you handle my data?",
    a: "We use industry-standard practices to protect your account and project data. Prompts may be processed by AI providers to generate results—avoid pasting secrets or highly sensitive information.",
  },
  {
    q: "Where can I get help?",
    a: "Use in-product flows first. For organizations, priority support will be part of the upcoming team plan; until then, reach out through the channels listed on your account or site footer.",
  },
];

export default function FaqSection() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-8 py-24">
      <h2 className="mb-4 text-center text-5xl font-bold text-gray-100">
        Frequently asked questions
      </h2>
      <p className="mx-auto mb-12 max-w-2xl text-center text-gray-400">
        Everything you need to know about building landing pages with Adorable.
      </p>

      <div className="mx-auto w-full max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem
              key={item.q}
              value={`faq-${i}`}
              className="border-neutral-800"
            >
              <AccordionTrigger className="group flex w-full items-center justify-between gap-4 py-5 text-lg font-medium text-gray-100 hover:text-white">
                <span className="pr-2">{item.q}</span>
                <Plus
                  className="h-5 w-5 shrink-0 text-neutral-400 transition-transform duration-300 ease-out group-data-[state=open]:rotate-45"
                  aria-hidden
                />
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-gray-400">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
