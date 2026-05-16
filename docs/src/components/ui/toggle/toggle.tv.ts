import { tv, type VariantProps } from "tailwind-variants";

export const toggleTrack = tv({
  base: [
    "relative inline-flex cursor-pointer border transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "w-14 h-7",
  ],
  variants: {
    checked: {
      on: "bg-primary border-primary",
      off: "bg-muted border-border",
    },
  },
  defaultVariants: { checked: "off" },
});

export const toggleThumb = tv({
  base: [
    "absolute top-0.5 bg-background transition-all duration-150",
    "h-5 w-5 left-0.5",
  ],
  variants: {
    checked: {
      on: "left-[calc(100%-1.375rem)]",
      off: "left-0.5",
    },
  },
  defaultVariants: { checked: "off" },
});

export type ToggleTrackVariants = VariantProps<typeof toggleTrack>;
export type ToggleThumbVariants = VariantProps<typeof toggleThumb>;
