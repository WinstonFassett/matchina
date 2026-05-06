import { tv, type VariantProps } from "tailwind-variants";

export const card = tv({
  base: "bg-card text-card-foreground flex flex-col gap-3 rounded-lg border border-border py-4",
});

export const cardHeader = tv({
  base: "grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4",
});

export const cardTitle = tv({
  base: "text-[14px] leading-snug font-semibold tracking-[-0.01em]",
});

export const cardDescription = tv({
  base: "text-muted-foreground text-[13px] leading-snug",
});

export const cardContent = tv({
  base: "px-4 text-[13px]",
});

export const cardFooter = tv({
  base: "flex items-center px-4 [.border-t]:pt-4",
});

export type CardVariants = VariantProps<typeof card>;
