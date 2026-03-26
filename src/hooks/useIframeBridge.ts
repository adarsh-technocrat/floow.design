"use client";

import { useCallback, useEffect, useRef } from "react";

function extractBody(html: string): string | null {
  const bodyOpen = html.indexOf("<body");
  if (bodyOpen === -1) return null;
  const bodyStart = html.indexOf(">", bodyOpen);
  if (bodyStart === -1) return null;
  const bodyClose = html.lastIndexOf("</body>");
  if (bodyClose === -1) return html.substring(bodyStart + 1);
  return html.substring(bodyStart + 1, bodyClose);
}

function extractCssVariables(html: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const re = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while (true) {
    match = re.exec(html);
    if (!match) break;
    vars[match[1]] = match[2].trim();
  }
  return vars;
}

function writeDocFull(iframe: HTMLIFrameElement | null, html: string) {
  if (!iframe?.contentDocument || !html) return;
  const doc = iframe.contentDocument;
  const scrollTop = doc.documentElement?.scrollTop ?? 0;
  doc.open();
  doc.write(html);
  doc.close();
  if (scrollTop > 0) {
    requestAnimationFrame(() => {
      if (iframe.contentDocument?.documentElement) {
        iframe.contentDocument.documentElement.scrollTop = scrollTop;
      }
    });
  }
}

export interface UseIframeBridgeOptions {
  onMessage?: (event: MessageEvent) => void;
  onAfterIncrementalBodyWrite?: () => void;
}

export interface UseIframeBridgeReturn {
  writeContent: (html: string, incremental?: boolean) => void;
  postToFrame: (message: object, targetOrigin?: string) => void;
  getWindow: () => Window | null;
  getDocument: () => Document | null;
}

export function useIframeBridge(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  options: UseIframeBridgeOptions = {},
): UseIframeBridgeReturn {
  const { onMessage, onAfterIncrementalBodyWrite } = options;
  const onMessageRef = useRef(onMessage);
  const onAfterIncrementalBodyWriteRef = useRef(onAfterIncrementalBodyWrite);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  useEffect(() => {
    onAfterIncrementalBodyWriteRef.current = onAfterIncrementalBodyWrite;
  }, [onAfterIncrementalBodyWrite]);

  const hasWrittenRef = useRef(false);
  const lastWrittenHtmlRef = useRef("");
  const lastBodyHtmlRef = useRef("");
  const lastCssVarsRef = useRef<Record<string, string>>({});
  const pendingIncrementalRef = useRef<{
    iframe: HTMLIFrameElement;
    newBody: string;
    cssVars: Record<string, string>;
    scrollTop: number;
  } | null>(null);
  const incrementalRafRef = useRef<number | null>(null);

  const writeContent = useCallback(
    (html: string, incremental = false) => {
      const iframe = iframeRef.current;
      if (!iframe || !html) return;

      if (html === lastWrittenHtmlRef.current) {
        return;
      }
      lastWrittenHtmlRef.current = html;

      const doc = iframe.contentDocument;

      if (incremental && hasWrittenRef.current && doc?.body) {
        const newBody = extractBody(html);
        if (newBody !== null) {
          pendingIncrementalRef.current = {
            iframe,
            newBody,
            cssVars: extractCssVariables(html),
            scrollTop: doc.documentElement?.scrollTop ?? 0,
          };
          if (incrementalRafRef.current == null) {
            incrementalRafRef.current = requestAnimationFrame(() => {
              incrementalRafRef.current = null;
              const pending = pendingIncrementalRef.current;
              pendingIncrementalRef.current = null;
              if (!pending?.iframe.contentDocument?.body) return;
              const root = pending.iframe.contentDocument.documentElement;
              if (root) {
                for (const [key, value] of Object.entries(pending.cssVars)) {
                  if (lastCssVarsRef.current[key] === value) continue;
                  root.style.setProperty(key, value);
                  lastCssVarsRef.current[key] = value;
                }
              }
              if (lastBodyHtmlRef.current === pending.newBody) {
                return;
              }
              lastBodyHtmlRef.current = pending.newBody;
              pending.iframe.contentDocument.body.innerHTML = pending.newBody;
              onAfterIncrementalBodyWriteRef.current?.();
              requestAnimationFrame(() => {
                if (pending.iframe.contentDocument?.documentElement) {
                  pending.iframe.contentDocument.documentElement.scrollTop =
                    pending.scrollTop;
                }
              });
            });
          }
          return;
        }
      }

      writeDocFull(iframe, html);
      lastBodyHtmlRef.current = extractBody(html) ?? "";
      lastCssVarsRef.current = extractCssVariables(html);
      hasWrittenRef.current = true;
    },
    [iframeRef],
  );

  const postToFrame = useCallback(
    (message: object, targetOrigin = "*") => {
      const win = iframeRef.current?.contentWindow;
      if (win) win.postMessage(message, targetOrigin);
    },
    [iframeRef],
  );

  const getWindow = useCallback((): Window | null => {
    return iframeRef.current?.contentWindow ?? null;
  }, [iframeRef]);

  const getDocument = useCallback((): Document | null => {
    return iframeRef.current?.contentDocument ?? null;
  }, [iframeRef]);

  useEffect(() => {
    if (!onMessage) return;
    const handler = (event: MessageEvent) => {
      if (iframeRef.current?.contentWindow !== event.source) return;
      onMessageRef.current?.(event);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onMessage, iframeRef]);

  return {
    writeContent,
    postToFrame,
    getWindow,
    getDocument,
  };
}
