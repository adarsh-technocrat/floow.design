export type ThemeVariables = Record<string, string>;
export type ThemeVariantMap = Record<string, ThemeVariables>;

/**
 * Detect whether a theme variables object uses the old flat format
 * (mixed --key and --key-dark) or the new structured variant format
 * ({light: {...}, dark: {...}}).
 */
export function isStructuredVariants(
  obj: unknown,
): obj is ThemeVariantMap {
  if (!obj || typeof obj !== "object") return false;
  const keys = Object.keys(obj);
  if (keys.length === 0) return false;
  // If any key starts with "--", it's the old flat format
  if (keys.some((k) => k.startsWith("--"))) return false;
  // Check that at least one value is an object (variant map)
  return keys.some(
    (k) => typeof (obj as Record<string, unknown>)[k] === "object",
  );
}

/**
 * Convert old flat theme ({--key: val, --key-dark: val2})
 * into structured variants ({light: {--key: val}, dark: {--key: val2}}).
 */
export function migrateFlatToVariants(
  flat: Record<string, string>,
): ThemeVariantMap {
  const light: ThemeVariables = {};
  const dark: ThemeVariables = {};
  for (const [k, v] of Object.entries(flat)) {
    if (!k.startsWith("--") || !v) continue;
    if (k.endsWith("-dark")) {
      // --primary-dark → --primary in dark variant
      const baseKey = k.slice(0, -5); // strip "-dark"
      dark[baseKey] = v;
    } else {
      light[k] = v;
    }
  }
  // Ensure dark variant has fallbacks from light for any missing keys
  for (const [k, v] of Object.entries(light)) {
    if (!(k in dark)) dark[k] = v;
  }
  const result: ThemeVariantMap = { light };
  if (Object.keys(dark).length > 0) result.dark = dark;
  return result;
}

/**
 * Resolve a flat ThemeVariables from a variant map for a given variant name.
 * Falls back to "light" if the requested variant doesn't exist.
 */
export function resolveVariant(
  variants: ThemeVariantMap,
  variantName: string,
): ThemeVariables {
  return variants[variantName] ?? variants.light ?? {};
}

/**
 * Normalize a theme from the DB: accepts either old flat format or new structured format.
 * Always returns ThemeVariantMap.
 */
export function ensureVariantMap(
  raw: unknown,
): ThemeVariantMap {
  if (!raw || typeof raw !== "object") return { light: {} };
  if (isStructuredVariants(raw)) return raw;
  // Old flat format
  return migrateFlatToVariants(raw as Record<string, string>);
}

const SCREEN_HTML_HEAD = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Screen</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Poppins:wght@100..900&family=Fira+Code:wght@300..700&family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link rel="stylesheet" href="https://cdn.hugeicons.com/font/hgi-stroke-rounded.css" />
    <style type="text/tailwindcss">
      @theme inline {
        --color-background: var(--background);
        --color-foreground: var(--foreground);
        --color-primary: var(--primary);
        --color-primary-foreground: var(--primary-foreground);
        --color-secondary: var(--secondary);
        --color-secondary-foreground: var(--secondary-foreground);
        --color-muted: var(--muted);
        --color-muted-foreground: var(--muted-foreground);
        --color-accent: var(--accent);
        --color-destructive: var(--destructive);
        --color-card: var(--card);
        --color-card-foreground: var(--card-foreground);
        --color-border: var(--border);
        --color-input: var(--input);
        --color-ring: var(--ring);
        --radius-sm: calc(var(--radius) - 4px);
        --radius-md: calc(var(--radius) - 2px);
        --radius-lg: var(--radius);
      }
      :root { /* THEME_VARS */ }
    </style>
  </head>
  <body>`;

const SCREEN_HTML_TAIL = `</body></html>`;

const THEME_KEY_ALIASES: Record<string, string> = {
  r: "--primary",
  y: "--secondary",
  t: "--accent",
  boarder: "--border",
};

export function normalizeThemeVars(
  raw: Record<string, string>,
): ThemeVariables {
  const out: ThemeVariables = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!v || typeof v !== "string") continue;
    const key = k.trim();
    if (!key) continue;
    const normalized = key.startsWith("--")
      ? key
      : (THEME_KEY_ALIASES[key] ?? `--${key.replace(/^--/, "")}`);
    out[normalized] = v;
  }
  return out;
}

export function wrapScreenBody(
  bodyContent: string,
  theme: ThemeVariables = {},
): string {
  const themeCSS = Object.entries(theme)
    .filter(([k]) => k.startsWith("--"))
    .map(([k, v]) => `        ${k}: ${v};`)
    .join("\n");
  const headWithTheme = SCREEN_HTML_HEAD.replace("/* THEME_VARS */", themeCSS);
  return `${headWithTheme}\n${bodyContent}\n${SCREEN_HTML_TAIL}`;
}

export function extractBodyContent(fullHtml: string): string {
  if (!fullHtml) return "";
  const match = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1].trim() : fullHtml;
}

export function looksLikeMalformedFrameContent(html: string): boolean {
  if (!html || typeof html !== "string") return true;
  const trimmed = html.trim();
  if (trimmed.length < 20) return false;
  const lower = trimmed.toLowerCase();
  const hasScriptTokens =
    lower.includes("payload.elementid") ||
    lower.includes("getboundingclientrect") ||
    (lower.includes("update_text") && lower.includes("elementid")) ||
    (lower.includes("computed font") && lower.includes("computed "));
  if (!hasScriptTokens) return false;
  const looksLikeHtml =
    trimmed.startsWith("<") ||
    trimmed.includes("<!doctype") ||
    (trimmed.match(/</g)?.length ?? 0) > 3;
  return !looksLikeHtml;
}

export function injectElementInspectorScript(
  html: string,
  scriptContent: string,
): string {
  if (!scriptContent.trim()) return html;
  const escaped = scriptContent.replace(/<\/script\s*>/gi, "<\\/script>");
  const script = `<script>${escaped}</script>`;
  return html.includes("</body>")
    ? html.replace("</body>", `${script}</body>`)
    : html + script;
}

export function truncatePartialHtml(html: string): string {
  if (!html) return html;

  const lastOpen = html.lastIndexOf("<");
  if (lastOpen === -1) return html;

  const afterOpen = html.substring(lastOpen);

  if (afterOpen.includes(">")) return html;

  return html.substring(0, lastOpen);
}

const SCROLLBAR_HIDE =
  "<style>html,body{-ms-overflow-style:none;scrollbar-width:none}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}</style>";

export function injectFrameScripts(html: string): string {
  if (html.includes("</head>"))
    return html.replace("</head>", SCROLLBAR_HIDE + "</head>");
  if (/<body[\s>]/i.test(html))
    return html.replace(/<body(\s[^>]*)?>/i, (m) => m + SCROLLBAR_HIDE);
  return SCROLLBAR_HIDE + html;
}
