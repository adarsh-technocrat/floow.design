/**
 * Clipboard utility for Figma HTML export.
 *
 * Safari requires clipboard.write() to be called synchronously within
 * a user gesture. The deferred clipboard pattern creates a ClipboardItem
 * with Promise-based blobs during the gesture, then resolves them after
 * the async API call completes.
 */

export const isSafari = (): boolean => {
  if (typeof window === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

const isClipboardAvailable = (): boolean =>
  typeof window !== "undefined" &&
  typeof navigator !== "undefined" &&
  !!navigator.clipboard?.write;

export const hasClipboardSupport = (): boolean => {
  if (typeof window === "undefined") return false;
  const isSecure =
    window.isSecureContext ||
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost";
  if (!isSecure) return false;
  return isClipboardAvailable();
};

export const checkClipboardPermissions = async (): Promise<{
  canProceed: boolean;
  errorMessage?: string;
}> => {
  if (!hasClipboardSupport()) {
    return {
      canProceed: false,
      errorMessage: "Clipboard API is not available in this browser.",
    };
  }

  if (document.hasFocus && !document.hasFocus()) {
    return {
      canProceed: false,
      errorMessage: "Please keep this tab focused to copy.",
    };
  }

  if (navigator.permissions) {
    try {
      const p = await navigator.permissions.query({
        name: "clipboard-write" as PermissionName,
      });
      if (p.state === "denied") {
        return {
          canProceed: false,
          errorMessage:
            "Clipboard permission denied. Please enable it in browser settings.",
        };
      }
    } catch {
      // Permission API may not support clipboard-write, continue
    }
  }

  return { canProceed: true };
};

/**
 * Deferred clipboard copy for Safari compatibility.
 * Creates ClipboardItem synchronously during user gesture,
 * resolves the data asynchronously after API call.
 */
export const createDeferredClipboardCopy = (): {
  resolve: (data: string) => Promise<void>;
  reject: (error: Error) => void;
} => {
  let resolveData: ((value: string) => void) | null = null;
  let rejectData: ((reason?: unknown) => void) | null = null;
  const dataPromise = new Promise<string>((resolve, reject) => {
    resolveData = resolve;
    rejectData = reject;
  });

  let resolveHtmlBlob: ((value: Blob) => void) | null = null;
  let resolvePlainTextBlob: ((value: Blob) => void) | null = null;
  const htmlBlobPromise = new Promise<Blob>((resolve, reject) => {
    resolveHtmlBlob = resolve;
    dataPromise.catch(reject);
  });
  const plainTextBlobPromise = new Promise<Blob>((resolve, reject) => {
    resolvePlainTextBlob = resolve;
    dataPromise.catch(reject);
  });

  let clipboardWritePromise: Promise<void>;
  let writeInitiated = false;

  try {
    const clipboardItem = new ClipboardItem({
      "text/html": htmlBlobPromise,
      "text/plain": plainTextBlobPromise,
    });
    clipboardWritePromise = navigator.clipboard.write([clipboardItem]);
    writeInitiated = true;
  } catch {
    writeInitiated = false;
    clipboardWritePromise = Promise.reject(
      new Error("Failed to create clipboard item"),
    );
  }

  const processData = async () => {
    const data = await Promise.race([
      dataPromise,
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Export timeout (30s)")), 30000),
      ),
    ]);

    const htmlBlob = new Blob([data], { type: "text/html" });
    const plainTextBlob = new Blob([data], { type: "text/plain" });
    if (resolveHtmlBlob) resolveHtmlBlob(htmlBlob);
    if (resolvePlainTextBlob) resolvePlainTextBlob(plainTextBlob);

    if (writeInitiated) {
      await clipboardWritePromise;
    } else {
      await navigator.clipboard.writeText(data);
    }
  };

  const processPromise = processData().catch((error) => {
    if (rejectData) rejectData(error);
    return Promise.reject(error);
  });

  clipboardWritePromise.catch(() => {});

  return {
    resolve: async (data: string) => {
      if (resolveData) resolveData(data);
      await processPromise;
    },
    reject: (error: Error) => {
      if (rejectData) rejectData(error);
    },
  };
};

/**
 * Copy Figma HTML directly (for non-Safari browsers).
 */
export const copyFigmaHTML = async (figmaHtml: string): Promise<void> => {
  const htmlBlob = new Blob([figmaHtml], { type: "text/html" });
  const textBlob = new Blob([figmaHtml], { type: "text/plain" });

  try {
    const item = new ClipboardItem({
      "text/html": Promise.resolve(htmlBlob),
      "text/plain": Promise.resolve(textBlob),
    });
    await navigator.clipboard.write([item]);
  } catch {
    // Fallback to writeText
    await navigator.clipboard.writeText(figmaHtml);
  }
};
