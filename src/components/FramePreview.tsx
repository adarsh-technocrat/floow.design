"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useIframeBridge } from "@/hooks/useIframeBridge";
import { useAppSelector } from "@/store/hooks";
import {
  injectFrameScripts,
  injectFrameIdMeta,
  injectElementInspectorScript,
  truncatePartialHtml,
  looksLikeMalformedFrameContent,
} from "@/lib/screen-utils";
import http from "@/lib/http";

const LOADING_THRESHOLD = 50;
const POST_DEBOUNCE_MS = 2000;
const WRITE_THROTTLE_MS = 250;

const IFRAME_STYLE = { overflow: "auto" } as const;

export interface FramePreviewProps {
  frameId: string;
  html: string;
  label?: string;
  left?: number;
  top?: number;
  canvasScale?: number;
  allowInteraction?: boolean;
  enableElementInspection?: boolean;
  iframeRef?: React.MutableRefObject<HTMLIFrameElement | null>;
  onMessageFromFrame?: (event: MessageEvent) => void;
}

export const FramePreview = React.forwardRef<
  HTMLIFrameElement,
  FramePreviewProps
>(function FramePreview(
  {
    frameId,
    html,
    label,
    left,
    top,
    canvasScale = 1,
    allowInteraction = false,
    enableElementInspection = false,
    iframeRef: iframeExternalRef,
    onMessageFromFrame,
  },
  ref,
) {
  const projectId = useAppSelector((s) => s.project.projectId) ?? "";
  const isStreaming = html.length < LOADING_THRESHOLD;
  const [_loadKey, setLoadKey] = useState(0);
  const [inspectorScript, setInspectorScript] = useState("");
  const [wasStreaming] = useState(() => isStreaming);
  const internalRef = useRef<HTMLIFrameElement>(null);
  const postTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestHtmlRef = useRef("");
  const enableInspectionRef = useRef(enableElementInspection);
  const inspectorScriptRef = useRef(inspectorScript);
  useEffect(() => {
    enableInspectionRef.current = enableElementInspection;
  }, [enableElementInspection]);
  useEffect(() => {
    inspectorScriptRef.current = inspectorScript;
  }, [inspectorScript]);

  const reinjectElementInspector = useCallback(() => {
    if (!enableInspectionRef.current || !inspectorScriptRef.current) return;
    const doc = internalRef.current?.contentDocument;
    if (!doc?.body) return;
    doc.querySelectorAll("script[data-inspector]").forEach((n) => n.remove());
    const script = doc.createElement("script");
    script.setAttribute("data-inspector", "true");
    script.textContent = inspectorScriptRef.current;
    doc.body.appendChild(script);
  }, []);

  const { writeContent } = useIframeBridge(internalRef, {
    onMessage: onMessageFromFrame,
    onAfterIncrementalBodyWrite: reinjectElementInspector,
  });

  useEffect(() => {
    if (!enableElementInspection) return;
    fetch("/api/scripts/element-inspector")
      .then((r) => r.text())
      .then(setInspectorScript)
      .catch(() => {});
  }, [enableElementInspection]);

  const preparedHtml = useMemo(() => {
    if (!html) return "";
    if (looksLikeMalformedFrameContent(html)) return "";
    const safeHtml = truncatePartialHtml(html);
    if (!safeHtml) return "";
    let out = injectFrameScripts(safeHtml);
    if (enableElementInspection && inspectorScript) {
      out = injectFrameIdMeta(out, frameId);
      out = injectElementInspectorScript(out, inspectorScript);
    }
    return out;
  }, [html, enableElementInspection, inspectorScript, frameId]);

  useEffect(() => {
    if (!html || isStreaming) return;
    if (postTimeoutRef.current) clearTimeout(postTimeoutRef.current);
    postTimeoutRef.current = setTimeout(() => {
      postTimeoutRef.current = null;
      http
        .post("/api/frames", { frameId, html, label, left, top, projectId })
        .then(() => setLoadKey((k) => k + 1))
        .catch(() => {});
    }, POST_DEBOUNCE_MS);
    return () => {
      if (postTimeoutRef.current) clearTimeout(postTimeoutRef.current);
    };
  }, [frameId, html, label, left, top, isStreaming, projectId]);

  const prevHtmlLenRef = useRef(0);
  const lastWriteTimeRef = useRef(0);

  useEffect(() => {
    if (!preparedHtml) return;
    latestHtmlRef.current = preparedHtml;

    const doWrite = (_incremental: boolean) => {
      lastWriteTimeRef.current = Date.now();
      const htmlToWrite = latestHtmlRef.current;
      writeContent(htmlToWrite, true);
    };

    const now = Date.now();
    const timeSinceLastWrite = now - lastWriteTimeRef.current;
    const htmlGrew = preparedHtml.length > prevHtmlLenRef.current;
    prevHtmlLenRef.current = preparedHtml.length;

    if (htmlGrew && timeSinceLastWrite < WRITE_THROTTLE_MS * 2) {
      if (writeTimeoutRef.current) return;
      writeTimeoutRef.current = setTimeout(() => {
        writeTimeoutRef.current = null;
        doWrite(true);
      }, WRITE_THROTTLE_MS);
    } else {
      if (writeTimeoutRef.current) {
        clearTimeout(writeTimeoutRef.current);
        writeTimeoutRef.current = null;
      }
      doWrite(false);
    }

    return () => {
      if (writeTimeoutRef.current) {
        clearTimeout(writeTimeoutRef.current);
        writeTimeoutRef.current = null;
      }
    };
  }, [preparedHtml, writeContent]);

  const setRef = useCallback(
    (el: HTMLIFrameElement | null) => {
      (
        internalRef as React.MutableRefObject<HTMLIFrameElement | null>
      ).current = el;
      if (iframeExternalRef) iframeExternalRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref)
        (ref as React.MutableRefObject<HTMLIFrameElement | null>).current = el;
    },
    [ref, iframeExternalRef],
  );

  const handleIframeLoad = useCallback(() => {
    if (!latestHtmlRef.current) return;
    const htmlToWrite = latestHtmlRef.current;
    writeContent(htmlToWrite);
  }, [writeContent]);

  const showFadeIn = wasStreaming && !isStreaming;

  const isMalformed = looksLikeMalformedFrameContent(html);

  if (!html || html.length === 0 || isMalformed) {
    return (
      <div
        className="relative size-full overflow-hidden"
        data-frame-id={frameId}
      />
    );
  }

  const iframeClassName = [
    "border-0 bg-white scrollbar-hide origin-top-left",
    showFadeIn && "frame-fade-in",
    allowInteraction ? "pointer-events-auto" : "pointer-events-none",
  ]
    .filter(Boolean)
    .join(" ");

  // Counter-scale: render iframe at higher resolution, shrink back visually.
  // Capped at 3x to avoid excessive memory use.
  const renderScale = Math.min(Math.max(Math.ceil(canvasScale), 1), 3);
  const iframeStyle =
    renderScale > 1
      ? {
          ...IFRAME_STYLE,
          width: `${renderScale * 100}%`,
          height: `${renderScale * 100}%`,
          transform: `scale(${1 / renderScale})`,
          transformOrigin: "top left" as const,
        }
      : { ...IFRAME_STYLE, width: "100%", height: "100%" };

  return (
    <iframe
      ref={setRef}
      title="Canvas Frame"
      data-frame-id={frameId}
      sandbox="allow-scripts allow-same-origin"
      className={iframeClassName}
      style={iframeStyle}
      srcDoc=""
      onLoad={handleIframeLoad}
    />
  );
});
