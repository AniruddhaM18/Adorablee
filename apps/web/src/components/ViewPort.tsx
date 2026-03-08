export function Viewport({ url }: { url: string }) {
  return (
    <div className="h-full w-full bg-neutral-900 overflow-hidden">
      <iframe
        src={url}
        className="h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}
