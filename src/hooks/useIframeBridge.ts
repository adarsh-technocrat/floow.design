"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Extract <body>…</body> inner content from a full HTML document string.
 * Returns null if no <body> tag is found.
 */
function extractBody(html: string): string | null {
  const bodyOpen = html.indexOf("<body");
  if (bodyOpen === -1) return null;
  const bodyStart = html.indexOf(">", bodyOpen);
  if (bodyStart === -1) return null;
  const bodyClose = html.lastIndexOf("</body>");
  if (bodyClose === -1) return html.substring(bodyStart + 1);
  return html.substring(bodyStart + 1, bodyClose);
}

function writeDocFull(iframe: HTMLIFrameElement | null, html: string) {
  if (!iframe?.contentDocument || !html) return;
  const doc = iframe.contentDocument;
  doc.open();
  doc.write(html);
  doc.close();
}

export interface UseIframeBridgeOptions {
  onMessage?: (event: MessageEvent) => void;
}

export interface UseIframeBridgeReturn {
  /** Write HTML to the iframe. When `incremental` is true, only the <body> is patched (no bounce). */
  writeContent: (html: string, incremental?: boolean) => void;
  postToFrame: (message: object, targetOrigin?: string) => void;
  getWindow: () => Window | null;
  getDocument: () => Document | null;
}

export function useIframeBridge(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  options: UseIframeBridgeOptions = {},
): UseIframeBridgeReturn {
  const { onMessage } = options;
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // Track whether we've done an initial full write (scripts need to execute once)
  const hasWrittenRef = useRef(false);

  const writeContent = useCallback(
    (html: string, incremental = false) => {
      const iframe = iframeRef.current;
      if (!iframe || !html) return;
      const doc = iframe.contentDocument;

      // Incremental update: patch body innerHTML only (avoids full page teardown)
      // Only works after the initial full write (so scripts have executed once)
      if (incremental && hasWrittenRef.current && doc?.body) {
        const newBody = extractBody(html);
        if (newBody !== null) {
          const scrollTop = doc.documentElement?.scrollTop ?? 0;
          doc.body.innerHTML = newBody;
          doc.documentElement.scrollTop = scrollTop;
          return;
        }
      }

      // Full document write — used for first render and final (non-streaming) writes
      // so that <script> tags execute properly
      writeDocFull(iframe, html);
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
