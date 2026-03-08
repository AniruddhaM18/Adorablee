import { tool } from "@langchain/core/tools";
import { z } from "zod";
import FirecrawlApp from "@mendable/firecrawl-js";

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const SERPER_URL = "https://google.serper.dev/search";

type SerperOrganicResult = {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
};

type SerperResponse = {
  organic?: SerperOrganicResult[];
  organic_results?: SerperOrganicResult[];
  knowledgeGraph?: {
    title?: string;
    description?: string;
    website?: string;
    attributes?: Record<string, string>;
  };
  answerBox?: { answer?: string; snippet?: string };
};

// Domains that block scrapers or are JS-only — skip them
const SKIP_DOMAINS = [
  "twitter.com", "x.com", "facebook.com", "instagram.com",
  "linkedin.com", "reddit.com", "youtube.com", "tiktok.com",
  "pinterest.com", "yelp.com",
];

function shouldSkip(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return SKIP_DOMAINS.some((d) => host.includes(d));
  } catch {
    return true;
  }
}

// Firecrawl scrape: returns clean markdown of a page
async function scrapeWithFirecrawl(url: string): Promise<string> {
  if (!FIRECRAWL_API_KEY) return "";
  try {
    const app = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
    // Support both scrapeUrl (older SDK) and scrape (newer SDK)
    const scrapeMethod = (app as any).scrapeUrl ?? (app as any).scrape;
    if (typeof scrapeMethod !== "function") {
      console.warn("[firecrawl] No scrape method found on FirecrawlApp");
      return "";
    }
    const result = await scrapeMethod.call(app, url, {
      formats: ["markdown"],
      onlyMainContent: true,
    });

    if (!result || result.success === false) return "";
    // Markdown may be at result.markdown or result.data.markdown depending on SDK version
    const markdown = result.markdown ?? result.data?.markdown ?? "";
    return typeof markdown === "string" ? markdown.slice(0, 5000) : "";
  } catch (err) {
    console.warn("[firecrawl] scrape failed for", url, err instanceof Error ? err.message : err);
    return "";
  }
}

// ---------------------------------------------------------------------------
// Main search function
// ---------------------------------------------------------------------------
async function searchWeb(query: string, maxResults = 5): Promise<string> {
  console.log("[web_search] query:", query);

  if (!SERPER_API_KEY) {
    return JSON.stringify({
      error: "SERPER_API_KEY not set. Add it to .env (free at https://serper.dev).",
      query,
    });
  }

  // 1. Get search results from Serper
  let organic: SerperOrganicResult[] = [];
  let knowledgeGraph: SerperResponse["knowledgeGraph"] | undefined;
  let answerBox: SerperResponse["answerBox"] | undefined;

  try {
    const res = await fetch(SERPER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": SERPER_API_KEY,
      },
      body: JSON.stringify({ q: query, num: 8 }),
    });

    if (!res.ok) {
      const err = await res.text();
      return JSON.stringify({ error: `Search API error ${res.status}: ${err}`, query });
    }

    const data = (await res.json()) as SerperResponse;
    organic = data.organic ?? data.organic_results ?? [];
    knowledgeGraph = data.knowledgeGraph;
    answerBox = data.answerBox;
    console.log("[web_search] Serper returned", organic.length, "results");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return JSON.stringify({ error: `Search failed: ${msg}`, query });
  }

  // 2. Scrape top pages with Firecrawl (up to 2 pages in parallel)
  const scrapeable = organic
    .filter((r) => r.link && !shouldSkip(r.link))
    .slice(0, 2);

  const scraped: { url: string; title: string; content: string }[] = [];

  if (FIRECRAWL_API_KEY && scrapeable.length > 0) {
    console.log("[firecrawl] Scraping", scrapeable.length, "pages...");
    const results = await Promise.all(
      scrapeable.map(async (r) => ({
        url: r.link!,
        title: r.title ?? "",
        content: await scrapeWithFirecrawl(r.link!),
      }))
    );
    scraped.push(...results.filter((r) => r.content.length > 100));
    console.log("[firecrawl] Got content from", scraped.length, "pages");
  }

  // 3. Build output
  const parts: string[] = [];

  // Knowledge graph (most reliable for brand info)
  if (knowledgeGraph?.title || knowledgeGraph?.description) {
    let kg = `=== KNOWLEDGE GRAPH ===\nTitle: ${knowledgeGraph.title ?? ""}\nDescription: ${knowledgeGraph.description ?? ""}`;
    if (knowledgeGraph.website) kg += `\nWebsite: ${knowledgeGraph.website}`;
    if (knowledgeGraph.attributes) {
      const attrs = Object.entries(knowledgeGraph.attributes)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      if (attrs) kg += `\nAttributes:\n${attrs}`;
    }
    parts.push(kg);
  }

  // Direct answer box
  if (answerBox?.answer || answerBox?.snippet) {
    parts.push(`=== DIRECT ANSWER ===\n${answerBox.answer ?? answerBox.snippet}`);
  }

  // Snippets from all results
  const snippets = organic.slice(0, maxResults).map((r, i) =>
    `[${i + 1}] ${r.title ?? ""}\nURL: ${r.link ?? ""}\n${r.snippet ?? ""}`
  );
  if (snippets.length > 0) {
    parts.push(`=== SEARCH SNIPPETS ===\n${snippets.join("\n\n")}`);
  }

  // Full scraped page content
  for (const { url, title, content } of scraped) {
    parts.push(`=== FULL PAGE: ${title}\nURL: ${url} ===\n${content}`);
  }

  if (!FIRECRAWL_API_KEY) {
    parts.push(
      "=== NOTE ===\nFirecrawl is not configured (FIRECRAWL_API_KEY missing). Only search snippets are available. Add FIRECRAWL_API_KEY to .env for much richer content (get a key at https://firecrawl.dev)."
    );
  }

  return parts.join("\n\n" + "─".repeat(60) + "\n\n") || JSON.stringify({ message: "No results found", query });
}

// LangChain tool export
export const webSearchTool = tool(
  async ({ query, max_results }) => {
    return await searchWeb(query, max_results ?? 5);
  },
  {
    name: "web_search",
    description:
      "Google Search + Firecrawl deep page scraping. Returns both search snippets AND full scraped page content (features, pricing, testimonials, real copy). ALWAYS call this before creating landing pages or topic pages. Run two searches per page: (1) '[Company] official website', (2) '[Company] features pricing how it works'.",
    schema: z.object({
      query: z.string().describe(
        "Specific search query. Always use company/brand name + qualifiers. Good: 'Stripe official website', 'Notion features pricing 2024', 'Airbnb how it works hosts guests'. Bad: 'Stripe', 'websites'."
      ),
      max_results: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .default(5)
        .describe("Number of search results to include (default 5)"),
    }),
  }
);

export function isWebSearchEnabled(): boolean {
  return Boolean(SERPER_API_KEY);
}
