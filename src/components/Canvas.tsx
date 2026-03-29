"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { SelectionToast } from "@/components/custom-toast/selection-toast";
import { Frame } from "@/components/Frame";
import { FramePreview } from "@/components/FramePreview";
import { StickyNote } from "@/components/StickyNote";
import { AgentCursors } from "@/components/AgentCursors";
import { AgentShutterOverlays } from "@/components/AgentShutterOverlay";
import { useCanvas } from "@/hooks/useCanvas";
import { useCanvasInteraction } from "@/hooks/useCanvasInteraction";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addNote,
  updateNote,
  removeNote,
  setSelectedNoteId,
  type NoteColor,
} from "@/store/slices/canvasSlice";
import { setCanvasToolMode } from "@/store/slices/uiSlice";
import { useAuth } from "@/contexts/AuthContext";
import { convertClientPointToContentPoint } from "@/lib/canvas-utils";
import http from "@/lib/http";

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const {
    transform,
    frames,
    selectedFrameIds,
    updateCanvasTransform,
    setSelectedFrameIds,
    toggleFrameSelectionState,
    updateFrameProperties,
    removeFrameFromCanvas,
    duplicateFrameById,
    zoomCanvasAtCursorPosition,
    fitView,
  } = useCanvas();

  const projectId = useAppSelector((s) => s.project.projectId) ?? "";
  const notes = useAppSelector((s) => s.canvas.notes);
  const selectedNoteId = useAppSelector((s) => s.canvas.selectedNoteId);
  const canvasToolMode = useAppSelector((s) => s.ui.canvasToolMode);
  const { user } = useAuth();
  const authorName = user?.displayName || user?.email?.split("@")[0];

  const persistFramePosition = useCallback(
    (
      frameId: string,
      label?: string,
      left?: number,
      top?: number,
      html?: string,
    ) => {
      const frame = frames.find((f) => f.id === frameId);
      if (!frame) return;
      http
        .post("/api/frames", {
          frameId: frame.id,
          html: html ?? frame.html,
          label: label ?? frame.label,
          left: left ?? frame.left,
          top: top ?? frame.top,
          projectId,
        })
        .catch(() => {});
    },
    [frames, projectId],
  );

  const prevFrameIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const currentIds = new Set(frames.map((f) => f.id));
    const prevIds = prevFrameIdsRef.current;
    const addedIds = [...currentIds].filter((id) => !prevIds.has(id));
    if (addedIds.length > 1) {
      fitView(
        containerRef.current,
        { top: 80, right: 80, bottom: 80, left: 400 },
        0.6,
      );
    } else if (
      addedIds.length === 1 &&
      selectedFrameIds[0] === addedIds[0] &&
      prevIds.size > 0
    ) {
      const frame = frames.find((f) => f.id === addedIds[0]);
      if (frame && frame.html && frame.html.length > 0)
        persistFramePosition(
          frame.id,
          frame.label,
          frame.left,
          frame.top,
          frame.html,
        );
    }
    prevFrameIdsRef.current = currentIds;
  }, [frames, selectedFrameIds, persistFramePosition, fitView]);

  const handlePositionChange = useCallback(
    (id: string, newLeft: number, newTop: number) => {
      updateFrameProperties(id, { left: newLeft, top: newTop });
      persistFramePosition(id, undefined, newLeft, newTop);
    },
    [updateFrameProperties, persistFramePosition],
  );

  const persistNote = useCallback(
    (noteId: string, changes?: Partial<Record<string, string | number>>) => {
      if (!projectId) return;
      const note = notes.find((n) => n.id === noteId);
      const data = {
        noteId,
        projectId,
        text: note?.text ?? "",
        left: note?.left ?? 0,
        top: note?.top ?? 0,
        width: note?.width ?? 228,
        height: note?.height ?? 228,
        color: note?.color ?? "yellow",
        fontSize: note?.fontSize ?? 16,
        ...changes,
      };
      http.post("/api/notes", data).catch(() => {});
    },
    [notes, projectId],
  );

  const deleteNoteFromDb = useCallback((noteId: string) => {
    http
      .delete(`/api/notes?noteId=${encodeURIComponent(noteId)}`)
      .catch(() => {});
  }, []);

  // Note handlers
  const handleNoteSelect = useCallback(
    (noteId: string) => {
      dispatch(setSelectedNoteId(noteId));
      setSelectedFrameIds([]);
    },
    [dispatch, setSelectedFrameIds],
  );

  const handleNoteTextChange = useCallback(
    (noteId: string, text: string) => {
      dispatch(updateNote({ id: noteId, changes: { text } }));
      persistNote(noteId, { text });
    },
    [dispatch, persistNote],
  );

  const handleNotePositionChange = useCallback(
    (noteId: string, newLeft: number, newTop: number) => {
      dispatch(
        updateNote({ id: noteId, changes: { left: newLeft, top: newTop } }),
      );
      persistNote(noteId, { left: newLeft, top: newTop });
    },
    [dispatch, persistNote],
  );

  const handleNoteSizeChange = useCallback(
    (
      noteId: string,
      changes: { left?: number; top?: number; width?: number; height?: number },
    ) => {
      dispatch(updateNote({ id: noteId, changes }));
      persistNote(noteId, changes);
    },
    [dispatch, persistNote],
  );

  const handleNoteColorChange = useCallback(
    (noteId: string, color: NoteColor) => {
      dispatch(updateNote({ id: noteId, changes: { color } }));
      persistNote(noteId, { color });
    },
    [dispatch, persistNote],
  );

  const handleNoteFontSizeChange = useCallback(
    (noteId: string, fontSize: number) => {
      dispatch(updateNote({ id: noteId, changes: { fontSize } }));
      persistNote(noteId, { fontSize });
    },
    [dispatch, persistNote],
  );

  const handleNoteDelete = useCallback(
    (noteId: string) => {
      dispatch(removeNote(noteId));
      deleteNoteFromDb(noteId);
    },
    [dispatch, deleteNoteFromDb],
  );

  const handleNoteDuplicate = useCallback(
    (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;
      const newId = `note-${Date.now()}`;
      dispatch(
        addNote({
          id: newId,
          left: note.left + 40,
          top: note.top + 40,
          color: note.color,
          authorName,
        }),
      );
      persistNote(newId, { authorName });
    },
    [dispatch, notes, persistNote, authorName],
  );

  // Handle canvas click to create note in note tool mode
  const handleCanvasClickForNote = useCallback(
    (e: React.MouseEvent) => {
      if (canvasToolMode !== "note") return;
      // Don't create note when clicking on existing nodes
      if (
        (e.target as Element).closest?.("[data-frame]") ||
        (e.target as Element).closest?.("[data-note]")
      )
        return;

      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const content = convertClientPointToContentPoint(
        e.clientX,
        e.clientY,
        rect,
        transform.x,
        transform.y,
        transform.scale,
      );
      const newId = `note-${Date.now()}`;
      dispatch(
        addNote({
          id: newId,
          left: content.x - 114,
          top: content.y - 114,
          authorName,
        }),
      );
      persistNote(newId, { authorName });
      // Switch back to select mode after placing note
      dispatch(setCanvasToolMode("select"));
    },
    [canvasToolMode, dispatch, transform, persistNote],
  );

  // Deselect note when clicking canvas background
  const handleCanvasPointerDownForDeselect = useCallback(
    (e: React.PointerEvent) => {
      if (!(e.target as Element).closest?.("[data-note]") && selectedNoteId) {
        dispatch(setSelectedNoteId(null));
      }
    },
    [selectedNoteId, dispatch],
  );

  const {
    isPanning,
    isMarquee,
    isZooming: _isZooming,
    spaceHeld,
    marqueeStartRef,
    marqueeEnd,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleFrameSelect,
    handleWheelFromFrame,
  } = useCanvasInteraction({
    containerRef,
    transform,
    frames,
    selectedFrameIds,
    updateCanvasTransform,
    setSelectedFrameIds,
    toggleFrameSelectionState,
    zoomCanvasAtCursorPosition,
    canvasToolMode,
  });

  useEffect(() => {
    const count = selectedFrameIds.length;
    if (count === 0) {
      toast.dismiss("selection");
    } else {
      const label =
        count === 1 ? "1 screen selected" : `${count} screens selected`;
      toast.custom(
        () => (
          <SelectionToast
            message={label}
            onCopy={() => {
              if (selectedFrameIds[0]) {
                duplicateFrameById(selectedFrameIds[0]);
                toast.success("Screen duplicated", {
                  position: "top-center",
                });
              }
            }}
            onDelete={() => {
              const count = selectedFrameIds.length;
              selectedFrameIds.forEach((id) => {
                http
                  .delete(`/api/frames?frameId=${encodeURIComponent(id)}`)
                  .catch(() => {});
                removeFrameFromCanvas(id);
              });
              toast.dismiss("selection");
              toast.success(
                count === 1 ? "Screen deleted" : `${count} screens deleted`,
                { position: "top-center" },
              );
            }}
          />
        ),
        {
          id: "selection",
          duration: Infinity,
          position: "top-center",
          closeButton: false,
        },
      );
    }
  }, [selectedFrameIds, duplicateFrameById, removeFrameFromCanvas]);

  const positionChangeHandlers = useRef(
    new Map<string, (l: number, t: number) => void>(),
  );
  const sizeChangeHandlers = useRef(
    new Map<
      string,
      (c: {
        left?: number;
        top?: number;
        width?: number;
        height?: number;
      }) => void
    >(),
  );

  /* eslint-disable react-hooks/refs -- cleanup stale handler refs when frames change */
  useMemo(() => {
    const ids = new Set(frames.map((f) => f.id));
    for (const k of positionChangeHandlers.current.keys()) {
      if (!ids.has(k)) {
        positionChangeHandlers.current.delete(k);
        sizeChangeHandlers.current.delete(k);
      }
    }
  }, [frames]);
  /* eslint-enable react-hooks/refs */

  const getPositionChangeHandler = useCallback(
    (id: string) => {
      let fn = positionChangeHandlers.current.get(id);
      if (!fn) {
        fn = (newLeft: number, newTop: number) =>
          handlePositionChange(id, newLeft, newTop);
        positionChangeHandlers.current.set(id, fn);
      }
      return fn;
    },
    [handlePositionChange],
  );

  const getSizeChangeHandler = useCallback(
    (id: string) => {
      let fn = sizeChangeHandlers.current.get(id);
      if (!fn) {
        fn = (changes: {
          left?: number;
          top?: number;
          width?: number;
          height?: number;
        }) => updateFrameProperties(id, changes);
        sizeChangeHandlers.current.set(id, fn);
      }
      return fn;
    },
    [updateFrameProperties],
  );

  const { x, y, scale } = transform;

  return (
    <div
      ref={containerRef}
      className="relative size-full contain-layout contain-paint overflow-hidden"
      style={{
        backgroundColor: "var(--canvas-bg)",
        backgroundImage: `radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
        cursor: isPanning
          ? "grabbing"
          : isMarquee
            ? "crosshair"
            : spaceHeld
              ? "grab"
              : canvasToolMode === "note"
                ? "crosshair"
                : "default",
        touchAction: "none",
      }}
      onPointerDown={(e) => {
        handleCanvasPointerDownForDeselect(e);
        handlePointerDown(e);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleCanvasClickForNote}
      tabIndex={0}
      role="application"
      aria-label="Canvas"
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          transform: `translate(${Math.round(x)}px, ${Math.round(y)}px) scale(${scale})`,
        }}
      >
        {/* eslint-disable react-hooks/refs -- marquee coordinates from ref during active drag */}
        {marqueeStartRef.current && marqueeEnd && (
          <svg
            className="pointer-events-none absolute z-50"
            style={{
              left: Math.min(marqueeStartRef.current.contentX, marqueeEnd.x),
              top: Math.min(marqueeStartRef.current.contentY, marqueeEnd.y),
              width: Math.abs(marqueeEnd.x - marqueeStartRef.current.contentX),
              height: Math.abs(marqueeEnd.y - marqueeStartRef.current.contentY),
            }}
          >
            <rect
              x="1.5"
              y="1.5"
              width="calc(100% - 3px)"
              height="calc(100% - 3px)"
              fill="rgba(138,135,248,0.12)"
              stroke="#8B7CFF"
              strokeOpacity="0.55"
              strokeWidth="3"
              strokeDasharray="10 7"
              rx="0"
            />
          </svg>
        )}
        {frames.map((frame) => (
          <Frame
            key={frame.id}
            id={frame.id}
            label={frame.label}
            html={frame.html}
            left={frame.left}
            top={frame.top}
            width={frame.width}
            height={frame.height}
            selected={selectedFrameIds.includes(frame.id)}
            onSelect={handleFrameSelect}
            showToolbar={
              selectedFrameIds.includes(frame.id) &&
              selectedFrameIds.length === 1
            }
            canvasScale={scale}
            onPositionChange={getPositionChangeHandler(frame.id)}
            onSizeChange={getSizeChangeHandler(frame.id)}
            spaceHeld={spaceHeld}
            onWheelForZoom={
              selectedFrameIds.includes(frame.id) &&
              selectedFrameIds.length === 1
                ? handleWheelFromFrame
                : undefined
            }
          >
            <FramePreview
              frameId={frame.id}
              html={frame.html}
              label={frame.label}
              left={frame.left}
              top={frame.top}
              allowInteraction={
                selectedFrameIds.includes(frame.id) &&
                selectedFrameIds.length === 1
              }
            />
          </Frame>
        ))}
        {/* eslint-enable react-hooks/refs */}
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            id={note.id}
            text={note.text}
            left={note.left}
            top={note.top}
            width={note.width}
            height={note.height}
            color={note.color}
            fontSize={note.fontSize}
            authorName={note.authorName}
            selected={selectedNoteId === note.id}
            canvasScale={scale}
            spaceHeld={spaceHeld}
            onSelect={handleNoteSelect}
            onTextChange={handleNoteTextChange}
            onPositionChange={handleNotePositionChange}
            onSizeChange={handleNoteSizeChange}
            onColorChange={handleNoteColorChange}
            onFontSizeChange={handleNoteFontSizeChange}
            onDelete={handleNoteDelete}
            onDuplicate={handleNoteDuplicate}
          />
        ))}
        <AgentShutterOverlays />
        <AgentCursors />
      </div>
    </div>
  );
}
