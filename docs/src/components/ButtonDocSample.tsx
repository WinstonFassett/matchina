import { useState, useCallback } from "react";
import {
  BUTTON_VARIANTS,
  BUTTON_SIZES,
  FRAMEWORKS,
  FRAMEWORK_LABELS,
  genButtonCode,
  type Framework,
  type ButtonVariant,
  type ButtonSize,
} from "@code/examples/components/button-samples";

// Syntax token colors mapped to CSS vars so they follow light/dark theme
const TOKEN_COLORS: Record<string, string> = {
  keyword: "var(--info)",
  string: "var(--warn)",
  number: "var(--warn)",
  comment: "var(--text-mute)",
  tag: "var(--purple)",
  attr: "var(--info)",
  punct: "var(--muted-foreground)",
  ident: "var(--foreground)",
  ws: "inherit",
  other: "inherit",
};

type Token = { type: string; text: string };

function tokenize(src: string): Token[] {
  const rules: [string, RegExp][] = [
    ["comment", /^\/\/[^\n]*|^\/\*[\s\S]*?\*\//],
    ["string", /^"(?:\\.|[^"\\])*"|^'(?:\\.|[^'\\])*'|^`(?:\\.|[^`\\])*`/],
    [
      "keyword",
      /^\b(?:import|from|export|function|const|let|return|default|if|else|async|await|type|as)\b/,
    ],
    ["tag", /^<\/?[a-zA-Z][\w-]*|^\/?>/],
    ["attr", /^\b[a-zA-Z][\w-]*(?==)/],
    ["number", /^\b\d+(?:\.\d+)?\b/],
    ["punct", /^[{}()\[\];,.:=<>+\-*/!?&|]/],
    ["ident", /^\b[A-Za-z_$][\w$]*\b/],
    ["ws", /^\s+/],
    ["other", /^[^\s]/],
  ];
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const rest = src.slice(i);
    let matched = false;
    for (const [type, re] of rules) {
      const m = rest.match(re);
      if (m) {
        out.push({ type, text: m[0] });
        i += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out.push({ type: "other", text: rest[0] });
      i++;
    }
  }
  return out;
}

function CodeDisplay({ code }: { code: string }) {
  return (
    <pre
      style={{
        margin: 0,
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "12px",
        lineHeight: 1.7,
        color: "var(--foreground)",
        whiteSpace: "pre",
        overflowX: "auto",
      }}
    >
      {tokenize(code).map((tok, i) => (
        <span key={i} style={{ color: TOKEN_COLORS[tok.type] }}>
          {tok.text}
        </span>
      ))}
    </pre>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      style={{
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "10px",
        letterSpacing: "0.06em",
        padding: "4px 10px",
        background: copied ? "var(--accent)" : "transparent",
        color: copied ? "var(--accent-ink)" : "var(--muted-foreground)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        borderRadius: 0,
        textTransform: "uppercase",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        transition: "background 120ms, color 120ms",
      }}
    >
      <svg
        width="9"
        height="9"
        viewBox="0 0 9 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <rect x="2.5" y="2.5" width="5.5" height="5.5" />
        <path d="M1 6V1h5" />
      </svg>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

interface VariantTileProps {
  item: ButtonVariant | ButtonSize;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function VariantTile({ item, active, onClick, children }: VariantTileProps) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        cursor: "pointer",
        padding: "16px 12px 10px",
        borderBottom: active
          ? "2px solid var(--accent)"
          : "2px solid transparent",
        marginBottom: -1,
        textAlign: "center",
        transition: "border-color 120ms",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 40,
          marginBottom: 8,
        }}
      >
        {children}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "9px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: active ? "var(--foreground)" : "var(--text-mute)",
        }}
      >
        {item.label}
      </div>
    </div>
  );
}

function ButtonPreview({
  variant = "default",
  size = "default",
}: {
  variant?: string;
  size?: string;
}) {
  const disabled = variant === "disabled";

  return (
    <button
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding:
          size === "sm"
            ? "4px 10px"
            : size === "lg"
              ? "10px 18px"
              : size === "icon"
                ? "8px"
                : "6px 14px",
        fontSize: size === "sm" ? "11px" : size === "lg" ? "14px" : "12.5px",
        fontFamily: "var(--font-sans, sans-serif)",
        fontWeight: 500,
        letterSpacing: "-0.005em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        borderRadius: "var(--radius, 0)",
        lineHeight: 1.2,
        transition: "background 120ms",
        ...getVariantStyles(variant),
      }}
    >
      Aa
    </button>
  );
}

function getVariantStyles(variant: string): React.CSSProperties {
  switch (variant) {
    case "default":
      return {
        background: "var(--primary)",
        color: "var(--primary-foreground)",
        border: "1px solid var(--primary)",
      };
    case "secondary":
      return {
        background: "var(--secondary)",
        color: "var(--secondary-foreground)",
        border: "1px solid var(--border)",
      };
    case "outline":
      return {
        background: "transparent",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
      };
    case "ghost":
      return {
        background: "transparent",
        color: "var(--muted-foreground)",
        border: "1px solid transparent",
      };
    case "destructive":
    case "disabled":
      return {
        background: "transparent",
        color: "var(--destructive)",
        border: "1px solid var(--border)",
      };
    default:
      return {
        background: "var(--primary)",
        color: "var(--primary-foreground)",
        border: "1px solid var(--primary)",
      };
  }
}

function FrameworkTabs({
  fw,
  setFw,
}: {
  fw: Framework;
  setFw: (f: Framework) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {FRAMEWORKS.map((f) => {
        const on = fw === f;
        return (
          <button
            key={f}
            onClick={() => setFw(f)}
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "10px",
              letterSpacing: "0.06em",
              padding: "7px 12px",
              background: "transparent",
              color: on ? "var(--foreground)" : "var(--muted-foreground)",
              border: 0,
              borderBottom: on
                ? "1.5px solid var(--accent)"
                : "1.5px solid transparent",
              marginBottom: -1,
              cursor: "pointer",
              borderRadius: 0,
              textTransform: "uppercase",
            }}
          >
            {FRAMEWORK_LABELS[f]}
          </button>
        );
      })}
    </div>
  );
}

function CodePanel({
  label,
  propStr,
  fw,
  setFw,
}: {
  label: string;
  propStr: string;
  fw: Framework;
  setFw: (f: Framework) => void;
}) {
  const code = genButtonCode(label, propStr, fw);
  const fileLabel = fw === "react" ? "button.tsx" : fw === "svelte" ? "Button.svelte" : "Button.astro";

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: "var(--card)",
        marginTop: -1,
      }}
    >
      <div
        style={{
          padding: "8px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "10px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--muted-foreground)",
            flex: 1,
          }}
        >
          {label} · {fileLabel}
        </span>
        <CopyButton code={code} />
      </div>
      <FrameworkTabs fw={fw} setFw={setFw} />
      <div
        style={{
          padding: "14px 16px",
          background: "var(--code, var(--card))",
          maxHeight: 260,
          overflowY: "auto",
        }}
      >
        <CodeDisplay code={code} />
      </div>
    </div>
  );
}

export function ButtonDocSample() {
  const [selectedVariant, setSelectedVariant] = useState(BUTTON_VARIANTS[0]);
  const [selectedSize, setSelectedSize] = useState(BUTTON_SIZES[1]);
  const [fw, setFw] = useState<Framework>("react");
  const [activeSection, setActiveSection] = useState<"variants" | "sizes">(
    "variants"
  );

  const selected = activeSection === "variants" ? selectedVariant : selectedSize;

  return (
    <div className="not-content" style={{ fontSize: "13px" }}>
      {/* Variants */}
      <div
        style={{
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          margin: "0 0 10px",
        }}
      >
        Variants
      </div>
      <div
        style={{
          display: "flex",
          border: "1px solid var(--border)",
          background: "var(--card)",
          borderBottom: "none",
        }}
      >
        {BUTTON_VARIANTS.map((v) => (
          <VariantTile
            key={v.id}
            item={v}
            active={activeSection === "variants" && selectedVariant.id === v.id}
            onClick={() => {
              setSelectedVariant(v);
              setActiveSection("variants");
            }}
          >
            <ButtonPreview variant={v.id} />
          </VariantTile>
        ))}
      </div>

      <CodePanel
        label={selected.label}
        propStr={selected.props}
        fw={fw}
        setFw={setFw}
      />

      {/* Sizes */}
      <div
        style={{
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          margin: "32px 0 10px",
        }}
      >
        Sizes
      </div>
      <div
        style={{
          display: "flex",
          border: "1px solid var(--border)",
          background: "var(--card)",
          borderBottom: "none",
        }}
      >
        {BUTTON_SIZES.map((s) => (
          <VariantTile
            key={s.id}
            item={s}
            active={activeSection === "sizes" && selectedSize.id === s.id}
            onClick={() => {
              setSelectedSize(s);
              setActiveSection("sizes");
            }}
          >
            <ButtonPreview size={s.id} />
          </VariantTile>
        ))}
      </div>
    </div>
  );
}
