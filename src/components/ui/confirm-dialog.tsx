"use client";

// A promise-based confirmation dialog that replaces the browser's native
// window.confirm(). Mount <ConfirmProvider> once near the app root, then call
// the hook:
//
//   const confirm = useConfirm();
//   if (!(await confirm({ title: "Delete this order?", destructive: true }))) return;
//
// Built on @radix-ui/react-dialog (already a dependency) and styled to match the
// shadcn look. The `admin-shell` class on the panel keeps it light inside the
// always-light admin (it's a harmless no-op elsewhere).

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type ConfirmFn = (opts?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [opts, setOpts] = React.useState<ConfirmOptions>({});
  const resolver = React.useRef<((v: boolean) => void) | null>(null);

  const confirm = React.useCallback<ConfirmFn>((o = {}) => {
    setOpts(o);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = React.useCallback((v: boolean) => {
    setOpen(false);
    resolver.current?.(v);
    resolver.current = null;
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <DialogPrimitive.Root
        open={open}
        onOpenChange={(o) => {
          if (!o) settle(false);
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="admin-shell fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-stone-200 bg-white p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <DialogPrimitive.Title className="text-lg font-semibold text-stone-900">
              {opts.title ?? "Are you sure?"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              className={opts.description ? "mt-2 text-sm text-stone-500" : "sr-only"}
            >
              {opts.description ?? "Please confirm this action."}
            </DialogPrimitive.Description>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => settle(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-300"
              >
                {opts.cancelText ?? "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => settle(true)}
                className={
                  "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 " +
                  (opts.destructive
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-400"
                    : "bg-stone-900 hover:bg-stone-800 focus:ring-stone-500")
                }
              >
                {opts.confirmText ?? "Confirm"}
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx;
}
