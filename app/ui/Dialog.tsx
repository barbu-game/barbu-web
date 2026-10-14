"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * Centered card on desktop, bottom sheet on phones. Without `onOpenChange` the dialog is modal
 * and cannot be dismissed (e.g. the pause overlay, driven by the server).
 */
export default function Dialog({
  open,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const dismissible = Boolean(onOpenChange);
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="animate-fade-in fixed inset-0 z-40 bg-black/60" />
        <RadixDialog.Content
          aria-describedby={undefined}
          // Focus the sheet itself: focusing its first field would pop the phone keyboard open.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).focus();
          }}
          onEscapeKeyDown={dismissible ? undefined : (e) => e.preventDefault()}
          onPointerDownOutside={dismissible ? undefined : (e) => e.preventDefault()}
          className={cn(
            "animate-fade-in fixed z-50 flex max-h-[85dvh] flex-col border border-border bg-surface shadow-2xl focus:outline-none",
            "inset-x-0 bottom-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,26rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:pb-0",
            className,
          )}
        >
          {title ? (
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border pl-5 pr-2">
              <RadixDialog.Title className="text-sm font-semibold">{title}</RadixDialog.Title>
              {dismissible && (
                <RadixDialog.Close className="grid h-9 w-9 place-items-center rounded-lg text-muted-fg outline-none hover:bg-white/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-gold-soft/70">
                  <X size={18} />
                </RadixDialog.Close>
              )}
            </div>
          ) : (
            <RadixDialog.Title className="sr-only">Dialog</RadixDialog.Title>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
