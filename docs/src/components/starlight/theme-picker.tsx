import { useEffect, useState } from "react";
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher";

type Name =
  | "editorial"
  | "tix"
  | "shad"
  | "neon-synthwave"
  | "cyberpunk-neon"
  | "pastel-kawaii"
  | "zen-garden"
  | "bubblegum-pop"
  | "retro-arcade"
  | "tropical-paradise"
  | "steampunk-cogs"
  | "space-odyssey"
  | "vintage-vinyl"
  | "misty-harbor";
type Mode = "light" | "dark" | "auto";

declare global {
  interface Window {
    Ui26Theme: {
      THEMES: readonly Name[];
      MODES: readonly Mode[];
      getName(): Name;
      getMode(): Mode;
      setName(name: Name): void;
      setMode(mode: Mode): void;
      subscribe(fn: (name: Name, mode: Mode) => void): () => void;
    };
  }
}

const LABELS: Record<Name, string> = {
  editorial: "Editorial",
  tix: "Tix",
  shad: "Shad",
  "neon-synthwave": "Synthwave",
  "cyberpunk-neon": "Cyberpunk",
  "pastel-kawaii": "Kawaii",
  "zen-garden": "Zen Garden",
  "bubblegum-pop": "Bubblegum",
  "retro-arcade": "Retro Arcade",
  "tropical-paradise": "Tropical",
  "steampunk-cogs": "Steampunk",
  "space-odyssey": "Space Odyssey",
  "vintage-vinyl": "Vintage Vinyl",
  "misty-harbor": "Misty Harbor",
};

const THEMES: readonly Name[] = [
  "editorial",
  "tix",
  "shad",
  "neon-synthwave",
  "cyberpunk-neon",
  "pastel-kawaii",
  "zen-garden",
  "bubblegum-pop",
  "retro-arcade",
  "tropical-paradise",
  "steampunk-cogs",
  "space-odyssey",
  "vintage-vinyl",
  "misty-harbor",
];

export function ThemePicker() {
  const [name, setName] = useState<Name>("editorial");

  useEffect(() => {
    if (typeof window === "undefined" || !window.Ui26Theme) return;
    setName(window.Ui26Theme.getName());
    return window.Ui26Theme.subscribe((n) => setName(n));
  }, []);

  return (
    <div className="ui26-theme-picker flex items-center gap-2">
      {import.meta.env.DEV && (
        <select
          aria-label="Select theme"
          className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
          onChange={(e) => window.Ui26Theme?.setName(e.target.value as Name)}
          value={name}
        >
          {THEMES.map((n) => (
            <option key={n} value={n}>
              {LABELS[n]}
            </option>
          ))}
        </select>
      )}
      <ThemeSwitcher
        className="w-fit"
        onChange={(m) => window.Ui26Theme?.setMode(m === "system" ? "auto" : (m as Mode))}
      />
    </div>
  );
}
