import { tv, type VariantProps } from "tailwind-variants";

export const button = tv({
  base: [
    "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap select-none",
    "rounded-lg text-sm font-medium tracking-[-0.005em]",
    "transition-[background-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]",
    "outline-none focus-visible:ring-[1.5px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:ring-[1.5px] aria-invalid:ring-destructive aria-invalid:ring-offset-2 aria-invalid:ring-offset-background",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5",
  ],
  variants: {
    variant: {
      default:
        "bg-primary text-primary-foreground shadow-[var(--highlight-inset),var(--shadow-xs)] hover:bg-primary/90",
      secondary:
        "bg-secondary text-secondary-foreground border border-border hover:bg-accent",
      outline:
        "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
      ghost:
        "hover:bg-accent hover:text-accent-foreground",
      destructive:
        "bg-destructive text-destructive-foreground shadow-[var(--highlight-inset),var(--shadow-xs)] hover:bg-destructive/90 focus-visible:ring-destructive",
    },
    size: {
      default: "h-8 px-3",
      sm: "h-7 px-2.5 text-xs",
      lg: "h-9 px-4",
      icon: "h-8 w-8",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type ButtonVariants = VariantProps<typeof button>;
