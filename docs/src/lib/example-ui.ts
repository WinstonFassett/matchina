import { tv } from "tailwind-variants";

const btn = tv({
  base: [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    "text-sm font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-40",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ],
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/80",
      outline: "border border-border bg-background text-foreground hover:bg-muted",
      ghost: "text-foreground hover:bg-muted",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
    },
    size: {
      sm: "h-7 px-3 text-xs",
      md: "h-9 px-4",
      lg: "h-10 px-6",
    },
  },
  defaultVariants: { variant: "default", size: "md" },
});

const badge = tv({
  base: [
    "inline-flex items-center font-mono text-[10px] uppercase tracking-widest",
    "border px-1.5 py-0.5",
  ],
  variants: {
    variant: {
      default: "border-border text-muted-foreground",
      active: "border-primary text-primary",
      success: "border-success text-success",
      warn: "border-warn text-warn",
      destructive: "border-destructive text-destructive",
    },
  },
  defaultVariants: { variant: "default" },
});

const stateDisplay = tv({
  slots: {
    root: "flex flex-col items-center gap-1",
    label: "font-mono text-[10px] uppercase tracking-widest text-muted-foreground",
    value: "font-semibold text-foreground tabular-nums",
  },
  variants: {
    size: {
      sm: { value: "text-2xl" },
      md: { value: "text-4xl" },
      lg: { value: "text-6xl" },
    },
  },
  defaultVariants: { size: "md" },
});

const toggleTrack = tv({
  base: [
    "relative inline-flex cursor-pointer border transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-40",
  ],
  variants: {
    checked: {
      true: "bg-primary border-primary",
      false: "bg-muted border-border",
    },
    size: {
      sm: "w-10 h-5",
      md: "w-14 h-7",
    },
  },
  defaultVariants: { checked: false, size: "md" },
});

const toggleThumb = tv({
  base: "absolute top-0.5 h-5 w-5 bg-background transition-all duration-150",
  variants: {
    checked: {
      true: "left-[calc(100%-1.375rem)]",
      false: "left-0.5",
    },
    size: {
      sm: "h-3.5 w-3.5 top-[3px]",
      md: "h-5 w-5 top-0.5",
    },
  },
  defaultVariants: { checked: false, size: "md" },
});

const card = tv({
  base: "border border-border bg-card text-card-foreground",
  variants: {
    pad: {
      none: "",
      sm: "p-3",
      md: "p-5",
      lg: "p-8",
    },
  },
  defaultVariants: { pad: "md" },
});

export const exBtn = btn;
export const exBadge = badge;
export const exStateDisplay = stateDisplay;
export const exToggleTrack = toggleTrack;
export const exToggleThumb = toggleThumb;
export const exCard = card;
