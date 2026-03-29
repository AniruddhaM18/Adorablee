"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      richColors
      position="top-center"
      closeButton
      toastOptions={{
        classNames: {
          toast: "bg-neutral-900 border border-neutral-700 text-neutral-100",
          title: "text-neutral-100",
          description: "text-neutral-400",
          actionButton: "bg-neutral-100 text-neutral-900",
        },
      }}
    />
  );
}
