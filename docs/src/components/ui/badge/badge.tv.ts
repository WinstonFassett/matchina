import { tv, type VariantProps } from "tailwind-variants";

export const badge = tv({
  base: [
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap select-none",
    "rounded-full border border-transparent px-2 py-0 text-[11px] font-medium tracking-[0.005em]",
    "h-[18px]",
    "transition-[color,background-color,box-shadow] duration-150",
    "outline-none focus-visible:ring-[1.5px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "aria-invalid:ring-[1.5px] aria-invalid:ring-destructive",
    "[&>svg]:pointer-events-none [&>svg]:size-3",
  ],
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground border-border",
      outline: "border-border text-foreground",
      ghost: "text-muted-foreground",
      destructive: "bg-destructive text-destructive-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type BadgeVariants = VariantProps<typeof badge>;
