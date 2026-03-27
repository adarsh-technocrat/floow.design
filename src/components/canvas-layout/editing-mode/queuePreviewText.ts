export function queuePreviewText(text: string): string {
  const t = text.trim();
  const sep = t.indexOf("]\n\n");
  if (sep !== -1 && t.startsWith("[")) {
    const after = t.slice(sep + 3).trim();
    if (after) return after;
  }
  return t;
}
