import { tv, type VariantProps } from "tailwind-variants";

export const chip = tv({
  base: [
    "inline-flex w-fit shrink-0 items-center gap-1.5 overflow-hidden whitespace-nowrap select-none",
    "rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium",
    "transition-[color,background-color,box-shadow] duration-150",
    "outline-none focus-visible:ring-[1.5px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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

export type ChipVariants = VariantProps<typeof chip>;
