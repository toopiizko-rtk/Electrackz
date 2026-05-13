// ElecTrack custom UI primitives — ported from original v2.
// Built directly on Radix to match the original aesthetic exactly.
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as LabelPrimitive from "@radix-ui/react-label";
import { ChevronDown, Check, X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/electrack";

// BUTTON
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-yellow-400 text-zinc-900 hover:bg-yellow-300 shadow-lg shadow-yellow-400/20",
        secondary: "bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-700",
        ghost: "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800",
        destructive: "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20",
        outline: "border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        xs: "h-6 px-2 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  },
);
Button.displayName = "Button";

// CARD
export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-xl bg-zinc-900 border border-zinc-800", className)} {...props} />
);
export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-5 pt-0", className)} {...props} />
);

// INPUT
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-400/60 transition-colors disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[70px] w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 resize-y focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-400/60",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export const Label = ({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) => (
  <LabelPrimitive.Root
    className={cn("text-xs font-semibold uppercase tracking-wide text-zinc-400", className)}
    {...props}
  />
);

// SELECT
export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectGroup = SelectPrimitive.Group;
export const SelectTrigger = ({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) => (
  <SelectPrimitive.Trigger
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-400/60",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon><ChevronDown className="h-4 w-4 text-zinc-400" /></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
);
export const SelectContent = ({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      position="popper"
      sideOffset={4}
      className={cn("relative z-[60] min-w-[8rem] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl", className)}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);
export const SelectItem = ({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) => (
  <SelectPrimitive.Item
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm text-zinc-300 outline-none hover:bg-zinc-800 hover:text-zinc-100 focus:bg-zinc-800 data-[state=checked]:text-yellow-400",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator><Check className="h-3 w-3" /></SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
);

// DIALOG — responsive: bottom-sheet on mobile, centered modal on tablet+
export const Dialog = DialogPrimitive.Root;
export const DialogClose = ({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) => (
  <DialogPrimitive.Close
    className={cn("rounded-lg p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors", className)}
    {...props}
  >
    <X className="h-4 w-4" />
  </DialogPrimitive.Close>
);

export const DialogContent = ({ className, children, onClose, ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & { onClose?: () => void }) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
    <DialogPrimitive.Content
      className={cn(
        // mobile: bottom sheet
        "fixed bottom-0 left-1/2 z-50 -translate-x-1/2 w-full max-w-[460px] max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-x border-zinc-700 bg-zinc-900 p-5 animate-slide-up focus:outline-none",
        // tablet+: centered modal
        "sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:max-w-[520px] sm:max-h-[85vh]",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center justify-between mb-5", className)} {...props} />
);
export const DialogTitle = ({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title className={cn("text-lg font-bold text-zinc-100", className)} {...props} />
);

// TABS
export const Tabs = TabsPrimitive.Root;
export const TabsList = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List className={cn("flex gap-1.5 rounded-lg bg-zinc-800/50 p-1", className)} {...props} />
);
export const TabsTrigger = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      "flex-1 rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-400 transition-all data-[state=active]:bg-yellow-400 data-[state=active]:text-zinc-900 hover:text-zinc-200",
      className,
    )}
    {...props}
  />
);
export const TabsContent = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn("mt-3", className)} {...props} />
);

// PROGRESS / SEPARATOR / SKELETON / CHIP
export const Separator = ({ className }: { className?: string }) => (
  <div className={cn("h-px w-full bg-zinc-800", className)} />
);
export const Progress = ({ value = 0, className, color = "bg-yellow-400" }: { value?: number; className?: string; color?: string }) => (
  <div className={cn("h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden", className)}>
    <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);
export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-lg bg-zinc-800", className)} />
);
export const Chip = ({ active, onClick, children, className }: { active?: boolean; onClick?: () => void; children: React.ReactNode; className?: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-full border text-xs font-semibold transition-all",
      active
        ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-400"
        : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200",
      className,
    )}
  >
    {children}
  </button>
);
