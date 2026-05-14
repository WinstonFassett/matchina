import { Laptop, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
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

const MODE_ICONS: Record<Mode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  auto: Laptop,
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
const MODES: readonly Mode[] = ["light", "dark", "auto"];

export function ThemePicker() {
  const [name, setName] = useState<Name>("editorial");
  const [mode, setMode] = useState<Mode>("auto");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.Ui26Theme) return;
    setName(window.Ui26Theme.getName());
    setMode(window.Ui26Theme.getMode());
    setMounted(true);
    return window.Ui26Theme.subscribe((n, m) => {
      setName(n);
      setMode(m);
    });
  }, []);

  return (
    <div className="ui26-theme-picker flex items-center gap-2">
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
      <ThemeSwitcher className="w-fit" onChange={(m) => window.Ui26Theme?.setMode(
        m == "system" ? "auto" : m as Mode
      )} />
      
      {/* <div
        aria-label="Select mode"
        className="flex items-center rounded-full border border-border bg-background p-0.5"
        role="group"
      >
        {MODES.map((m) => {
          const Icon = MODE_ICONS[m];
          const active = mounted && mode === m;
          return (
            <button
              aria-label={m}
              aria-pressed={active}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              key={m}
              onClick={() => window.Ui26Theme?.setMode(m)}
              type="button"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div> */}
    </div>
  );
}
