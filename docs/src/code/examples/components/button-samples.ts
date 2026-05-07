export type Framework = "react" | "svelte" | "astro";

export interface ButtonVariant {
  id: string;
  label: string;
  props: string;
}

export interface ButtonSize {
  id: string;
  label: string;
  props: string;
}

export const BUTTON_VARIANTS: ButtonVariant[] = [
  { id: "default", label: "Default", props: "" },
  { id: "secondary", label: "Secondary", props: 'variant="secondary"' },
  { id: "outline", label: "Outline", props: 'variant="outline"' },
  { id: "ghost", label: "Ghost", props: 'variant="ghost"' },
  { id: "destructive", label: "Destructive", props: 'variant="destructive"' },
  { id: "disabled", label: "Disabled", props: "disabled" },
];

export const BUTTON_SIZES: ButtonSize[] = [
  { id: "sm", label: "Small", props: 'size="sm"' },
  { id: "default", label: "Default", props: "" },
  { id: "lg", label: "Large", props: 'size="lg"' },
  { id: "icon", label: "Icon", props: 'size="icon"' },
];

const IMPORT = {
  react: `import { Button } from "@/components/ui/button"`,
  svelte: `import { Button } from "$lib/components/ui/button"`,
  astro: `import { Button } from "@/components/ui/button"`,
};

export function genButtonCode(
  label: string,
  propStr: string,
  fw: Framework
): string {
  const propsAttr = propStr ? ` ${propStr}` : "";
  if (fw === "react") {
    return `${IMPORT.react}

export function Demo() {
  return <Button${propsAttr}>${label}</Button>
}`;
  }
  if (fw === "svelte") {
    return `<script lang="ts">
  ${IMPORT.svelte};
</script>

<Button${propsAttr}>${label}</Button>`;
  }
  // astro
  return `---
${IMPORT.astro};
---

<Button${propsAttr}>${label}</Button>`;
}

export const FRAMEWORK_LABELS: Record<Framework, string> = {
  react: "React",
  svelte: "Svelte",
  astro: "Astro",
};

export const FRAMEWORKS: Framework[] = ["react", "svelte", "astro"];
