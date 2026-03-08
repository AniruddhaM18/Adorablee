export const BASE_TEMPLATE: Record<string, string> = {
  // package.json (UPDATED WITH DEPENDENCIES)
  "package.json": `{
  "name": "adorable-app",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite --host --port 5173",
    "build": "vite build",
    "preview": "vite preview --host --port 5173"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.460.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0",
    "tailwindcss": "^3.4.13",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20"
  }
}
`,

  // vite.config.js
  "vite.config.js": `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true
  },

  preview: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: "all"
  }
});
`,

  // tailwind.config.js
  "tailwind.config.js": `
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: "hsl(var(--primary))",
        primaryGlow: "hsl(var(--primary-glow))",
        secondary: "hsl(var(--secondary))",
        accent: "hsl(var(--accent))",
        muted: "hsl(var(--muted))",
        border: "hsl(var(--border))"
      },
      boxShadow: {
        elegant: "var(--shadow-elegant)",
        glow: "var(--shadow-glow)"
      }
    }
  },
  plugins: []
};
`,

  // postcss.config.js
  "postcss.config.js": `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
`,

  // index.html
  "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Adorable</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,

  // src/main.jsx
  "src/main.jsx": `
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,

  // src/index.css
  "src/index.css": `
@tailwind base;
@tailwind components;
@tailwind utilities;

/* =========================
   DESIGN TOKENS (HSL ONLY)
   ========================= */
:root {
  --background: 220 20% 98%;
  --foreground: 222 47% 11%;

  --primary: 245 80% 60%;
  --primary-glow: 245 90% 70%;
  --secondary: 210 40% 96%;
  --accent: 280 80% 65%;
  --muted: 215 16% 47%;
  --border: 214 32% 91%;

  --shadow-elegant: 0 10px 30px -10px hsl(var(--primary) / 0.35);
  --shadow-glow: 0 0 40px hsl(var(--primary-glow) / 0.45);
}

body {
  @apply bg-background text-foreground antialiased;
}
`,

  // src/App.jsx
  "src/App.jsx": `
export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <section className="rounded-2xl border border-border bg-secondary p-10 shadow-elegant">
        <h1 className="text-3xl font-semibold tracking-tight">
          Adorable is ready ✨
        </h1>
        <p className="mt-3 text-muted">
          Build something beautiful.
        </p>
      </section>
    </main>
  );
}
`
};