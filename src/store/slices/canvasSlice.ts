import { createSlice } from "@reduxjs/toolkit";
import {
  wrapScreenBody,
  extractBodyContent,
  looksLikeMalformedFrameContent,
  resolveVariant,
  ensureVariantMap,
  type ThemeVariables,
  type ThemeVariantMap,
} from "@/lib/screen-utils";

export type { ThemeVariables, ThemeVariantMap };

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export interface FrameState {
  id: string;
  label: string;
  left: number;
  top: number;
  width?: number;
  height?: number;
  html: string;
  themeId?: string;
  variantName?: string;
}

export type NoteColor =
  | "yellow"
  | "blue"
  | "green"
  | "pink"
  | "purple"
  | "orange";

export interface NoteState {
  id: string;
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  color: NoteColor;
  fontSize: number;
  authorName?: string;
}

export const NOTE_COLORS: Record<
  NoteColor,
  { bg: string; text: string; border: string }
> = {
  yellow: { bg: "#FEF9C3", text: "#713F12", border: "#FDE047" },
  blue: { bg: "#DBEAFE", text: "#1E3A5F", border: "#93C5FD" },
  green: { bg: "#DCFCE7", text: "#14532D", border: "#86EFAC" },
  pink: { bg: "#FCE7F3", text: "#831843", border: "#F9A8D4" },
  purple: { bg: "#EDE9FE", text: "#3B0764", border: "#C4B5FD" },
  orange: { bg: "#FFEDD5", text: "#7C2D12", border: "#FDBA74" },
};

export const DEFAULT_NOTE_WIDTH = 228;
export const DEFAULT_NOTE_HEIGHT = 228;
export const MIN_NOTE_SIZE = 100;

export interface StoredTheme {
  id: string;
  name: string;
  variants: ThemeVariantMap;
}

export type ThemeMode = "light" | "dark";

export const PITCH_CONCEPT_SLOT_COUNT = 3;

export interface PitchSlotState {
  themeId: string | null;
  variantName: string;
  description: string;
  hidden: boolean;
}

function createEmptyPitchSlots(
  variantName: ThemeMode = "dark",
): PitchSlotState[] {
  return Array.from({ length: PITCH_CONCEPT_SLOT_COUNT }, () => ({
    themeId: null,
    variantName,
    description: "",
    hidden: false,
  }));
}

interface CanvasState {
  transform: CanvasTransform;
  frames: FrameState[];
  notes: NoteState[];
  selectedFrameIds: string[];
  selectedNoteId: string | null;
  /** Resolved flat variables for the active theme + active variant */
  theme: ThemeVariables;
  themes: StoredTheme[];
  activeThemeId: string | null;
  activeThemeMode: ThemeMode;
  /** Frame used as the shared screen when comparing themes on the pitch board */
  pitchPreviewFrameId: string | null;
  pitchSlots: PitchSlotState[];
}

const initialState: CanvasState = {
  selectedFrameIds: [],
  selectedNoteId: null,
  transform: {
    x: 255.24,
    y: 410.117,
    scale: 0.556382,
  },
  frames: [],
  notes: [],
  theme: {},
  themes: [],
  activeThemeId: null,
  activeThemeMode: "dark",
  pitchPreviewFrameId: null,
  pitchSlots: createEmptyPitchSlots(),
};

/** Helper: get the active StoredTheme from state */
function getActiveTheme(state: CanvasState): StoredTheme | undefined {
  if (!state.activeThemeId) return undefined;
  return state.themes.find((t) => t.id === state.activeThemeId);
}

/** Helper: resolve the flat theme for the active theme+mode and set state.theme */
function syncResolvedTheme(state: CanvasState) {
  const active = getActiveTheme(state);
  if (active) {
    state.theme = resolveVariant(active.variants, state.activeThemeMode);
  }
}

/** Helper: re-wrap frames that don't have a per-frame theme override */
function rewrapGlobalFrames(state: CanvasState) {
  const fullTheme = { ...state.theme };
  for (const frame of state.frames) {
    // Skip frames with their own theme assignment
    if (frame.themeId && frame.themeId !== state.activeThemeId) {
      continue;
    }
    const bodyContent = extractBodyContent(frame.html);
    if (bodyContent) {
      // If frame has a specific variant, use that; otherwise use active mode
      const variant = frame.variantName ?? state.activeThemeMode;
      const activeTheme = getActiveTheme(state);
      const vars = activeTheme
        ? resolveVariant(activeTheme.variants, variant)
        : fullTheme;
      frame.html = wrapScreenBody(bodyContent, vars);
    }
  }
}

const canvasSlice = createSlice({
  name: "canvas",
  initialState,
  reducers: {
    setTransform: (state, action: { payload: Partial<CanvasTransform> }) => {
      state.transform = { ...state.transform, ...action.payload };
    },
    setZoom: (state, action: { payload: number }) => {
      state.transform.scale = action.payload;
    },
    addFrame: (state, action: { payload: Omit<FrameState, "id"> }) => {
      const id = String(Date.now());
      const payload = action.payload;
      state.frames.push({
        id,
        label: payload.label,
        left: payload.left,
        top: payload.top,
        html: payload.html ?? "",
      });
    },
    addFrameWithId: (
      state,
      action: {
        payload: {
          id: string;
          label: string;
          left: number;
          top: number;
          html?: string;
        };
      },
    ) => {
      const { id, label, left, top, html = "" } = action.payload;
      if (state.frames.some((f) => f.id === id)) return;
      state.frames.push({ id, label, left, top, html });
    },
    updateFrame: (
      state,
      action: { payload: { id: string; changes: Partial<FrameState> } },
    ) => {
      const frame = state.frames.find((f) => f.id === action.payload.id);
      if (frame) Object.assign(frame, action.payload.changes);
    },
    removeFrame: (state, action: { payload: string }) => {
      state.frames = state.frames.filter((f) => f.id !== action.payload);
      state.selectedFrameIds = state.selectedFrameIds.filter(
        (id) => id !== action.payload,
      );
    },
    duplicateFrame: (state, action: { payload: string }) => {
      const frame = state.frames.find((f) => f.id === action.payload);
      if (!frame) return;
      const newId = String(Date.now());
      state.frames.push({
        ...frame,
        id: newId,
        left: frame.left + 40,
        top: frame.top + 40,
      });
      state.selectedFrameIds = [newId];
    },
    updateFrameHtml: (
      state,
      action: { payload: { id: string; html: string } },
    ) => {
      if (looksLikeMalformedFrameContent(action.payload.html)) return;
      const frame = state.frames.find((f) => f.id === action.payload.id);
      if (frame) frame.html = action.payload.html;
    },

    /* ---- Theme reducers ---- */

    setTheme: (state, action: { payload: Partial<ThemeVariables> }) => {
      const updates = action.payload;
      // Update the resolved flat theme
      for (const k of Object.keys(updates)) {
        const v = updates[k];
        if (v !== undefined) state.theme[k] = v;
      }
      // Also update the active theme's active variant in the stored themes
      const active = getActiveTheme(state);
      if (active) {
        const variant = active.variants[state.activeThemeMode];
        if (variant) {
          for (const k of Object.keys(updates)) {
            const v = updates[k];
            if (v !== undefined) variant[k] = v;
          }
        }
      }
      rewrapGlobalFrames(state);
    },

    replaceTheme: (state, action: { payload: ThemeVariables }) => {
      state.theme = { ...action.payload };
      // Also replace the active variant in stored theme
      const active = getActiveTheme(state);
      if (active) {
        active.variants[state.activeThemeMode] = { ...action.payload };
      }
      rewrapGlobalFrames(state);
    },

    loadThemes: (
      state,
      action: {
        payload: Array<{
          id: string;
          name: string;
          variants?: ThemeVariantMap;
          variables?: ThemeVariables;
        }>;
      },
    ) => {
      // Auto-migrate old format
      state.themes = action.payload.map((t) => ({
        id: t.id,
        name: t.name,
        variants: t.variants ?? ensureVariantMap(t.variables ?? {}),
      }));
      if (state.themes.length === 0) {
        state.activeThemeId = null;
        state.theme = {};
        return;
      }

      const hasValidActiveTheme =
        !!state.activeThemeId &&
        state.themes.some((t) => t.id === state.activeThemeId);

      // Ensure activeThemeId always points to a theme in the current project.
      if (!hasValidActiveTheme) {
        state.activeThemeId = state.themes[0].id;
      }

      syncResolvedTheme(state);
    },

    setActiveThemeId: (state, action: { payload: string }) => {
      state.activeThemeId = action.payload;
      syncResolvedTheme(state);
      rewrapGlobalFrames(state);
    },

    setActiveThemeMode: (state, action: { payload: ThemeMode }) => {
      state.activeThemeMode = action.payload;
      // Sync pitch slots that haven't been manually assigned a theme
      for (const slot of state.pitchSlots) {
        if (!slot.themeId) {
          slot.variantName = action.payload;
        }
      }
      syncResolvedTheme(state);
      rewrapGlobalFrames(state);
    },

    upsertStoredTheme: (
      state,
      action: {
        payload: {
          id: string;
          name: string;
          variants?: ThemeVariantMap;
          variables?: ThemeVariables;
        };
      },
    ) => {
      const incoming = {
        id: action.payload.id,
        name: action.payload.name,
        variants:
          action.payload.variants ??
          ensureVariantMap(action.payload.variables ?? {}),
      };
      const idx = state.themes.findIndex((t) => t.id === incoming.id);
      if (idx >= 0) {
        state.themes[idx] = incoming;
      } else {
        state.themes.push(incoming);
      }
      if (state.activeThemeId === incoming.id) {
        syncResolvedTheme(state);
      }
    },

    /** Set a single variable in a specific theme's variant */
    setThemeVariantVariable: (
      state,
      action: {
        payload: {
          themeId: string;
          variantName: string;
          key: string;
          value: string;
        };
      },
    ) => {
      const { themeId, variantName, key, value } = action.payload;
      const theme = state.themes.find((t) => t.id === themeId);
      if (!theme) return;
      if (!theme.variants[variantName]) {
        theme.variants[variantName] = {};
      }
      theme.variants[variantName][key] = value;
      // If this is the active theme+variant, also update resolved theme
      if (
        themeId === state.activeThemeId &&
        variantName === state.activeThemeMode
      ) {
        state.theme[key] = value;
        rewrapGlobalFrames(state);
      }
    },

    /** Assign a specific theme + variant to a single frame */
    assignThemeToFrame: (
      state,
      action: {
        payload: { frameId: string; themeId: string; variantName: string };
      },
    ) => {
      const { frameId, themeId, variantName } = action.payload;
      const frame = state.frames.find((f) => f.id === frameId);
      if (!frame) return;
      frame.themeId = themeId;
      frame.variantName = variantName;
      const themeData = state.themes.find((t) => t.id === themeId);
      if (themeData) {
        const vars = resolveVariant(themeData.variants, variantName);
        const bodyContent = extractBodyContent(frame.html);
        if (bodyContent) {
          frame.html = wrapScreenBody(bodyContent, vars);
        }
      }
    },

    /** Add a new variant to a theme (e.g., "high-contrast") */
    addThemeVariant: (
      state,
      action: {
        payload: {
          themeId: string;
          variantName: string;
          baseVariant?: string;
        };
      },
    ) => {
      const { themeId, variantName, baseVariant } = action.payload;
      const theme = state.themes.find((t) => t.id === themeId);
      if (!theme || theme.variants[variantName]) return;
      const source = resolveVariant(theme.variants, baseVariant ?? "light");
      theme.variants[variantName] = { ...source };
    },

    removeThemeVariant: (
      state,
      action: { payload: { themeId: string; variantName: string } },
    ) => {
      const { themeId, variantName } = action.payload;
      if (variantName === "light") return; // Can't remove light
      const theme = state.themes.find((t) => t.id === themeId);
      if (!theme) return;
      delete theme.variants[variantName];
      // Reset any frames using this variant
      for (const frame of state.frames) {
        if (frame.themeId === themeId && frame.variantName === variantName) {
          frame.variantName = "light";
          const vars = resolveVariant(theme.variants, "light");
          const bodyContent = extractBodyContent(frame.html);
          if (bodyContent) {
            frame.html = wrapScreenBody(bodyContent, vars);
          }
        }
      }
      if (state.activeThemeMode === variantName) {
        const remaining = Object.keys(theme.variants);
        state.activeThemeMode = (remaining[0] ?? "dark") as ThemeMode;
        syncResolvedTheme(state);
      }
    },

    /* ---- Note reducers ---- */

    addNote: (
      state,
      action: {
        payload: {
          id?: string;
          left: number;
          top: number;
          color?: NoteColor;
          authorName?: string;
        };
      },
    ) => {
      const id = action.payload.id || `note-${Date.now()}`;
      state.notes.push({
        id,
        text: "",
        left: action.payload.left,
        top: action.payload.top,
        width: DEFAULT_NOTE_WIDTH,
        height: DEFAULT_NOTE_HEIGHT,
        color: action.payload.color ?? "yellow",
        fontSize: 16,
        authorName: action.payload.authorName,
      });
      state.selectedNoteId = id;
      state.selectedFrameIds = [];
    },
    updateNote: (
      state,
      action: { payload: { id: string; changes: Partial<NoteState> } },
    ) => {
      const note = state.notes.find((n) => n.id === action.payload.id);
      if (note) Object.assign(note, action.payload.changes);
    },
    removeNote: (state, action: { payload: string }) => {
      state.notes = state.notes.filter((n) => n.id !== action.payload);
      if (state.selectedNoteId === action.payload) {
        state.selectedNoteId = null;
      }
    },
    setSelectedNoteId: (state, action: { payload: string | null }) => {
      state.selectedNoteId = action.payload;
      if (action.payload) {
        state.selectedFrameIds = [];
      }
    },

    loadNotes: (
      state,
      action: {
        payload: Array<{
          id: string;
          text?: string;
          left?: number;
          top?: number;
          width?: number;
          height?: number;
          color?: string;
          fontSize?: number;
          authorName?: string;
        }>;
      },
    ) => {
      state.notes = action.payload.map((n) => ({
        id: n.id,
        text: n.text ?? "",
        left: n.left ?? 0,
        top: n.top ?? 0,
        width: n.width ?? DEFAULT_NOTE_WIDTH,
        height: n.height ?? DEFAULT_NOTE_HEIGHT,
        color: (n.color as NoteColor) ?? "yellow",
        fontSize: n.fontSize ?? 16,
        authorName: n.authorName,
      }));
    },

    reorderFrames: (state, action: { payload: string[] }) => {
      const order = action.payload;
      state.frames.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    },
    setSelectedFrames: (state, action: { payload: string[] }) => {
      state.selectedFrameIds = action.payload;
    },
    loadFrames: (
      state,
      action: {
        payload: Array<{
          id: string;
          label?: string;
          left?: number;
          top?: number;
          html?: string;
          themeId?: string;
          variantName?: string;
        }>;
      },
    ) => {
      state.frames = action.payload.map((f) => ({
        // Keep explicit per-frame variant only when frame has an assigned theme.
        // For legacy global frames, persisted "light" means "no override".
        variantName:
          !f.themeId && f.variantName === "light"
            ? undefined
            : (f.variantName ?? undefined),
        id: f.id,
        label: f.label ?? "Screen",
        left: f.left ?? 0,
        top: f.top ?? 0,
        html: f.html ?? "",
        themeId: f.themeId,
      }));
    },
    resetCanvas: (state) => {
      state.frames = [];
      state.notes = [];
      state.selectedFrameIds = [];
      state.selectedNoteId = null;
      state.theme = {};
      state.themes = [];
      state.activeThemeId = null;
      state.activeThemeMode = "dark";
      state.pitchPreviewFrameId = null;
      state.pitchSlots = createEmptyPitchSlots();
    },

    setPitchPreviewFrameId: (state, action: { payload: string | null }) => {
      state.pitchPreviewFrameId = action.payload;
    },

    updatePitchSlot: (
      state,
      action: {
        payload: {
          index: number;
          changes: Partial<Omit<PitchSlotState, never>>;
        };
      },
    ) => {
      const { index, changes } = action.payload;
      if (index < 0 || index >= state.pitchSlots.length) return;
      const slot = state.pitchSlots[index];
      if (!slot) return;
      Object.assign(slot, changes);
      if (changes.themeId !== undefined && changes.themeId !== null) {
        const theme = state.themes.find((t) => t.id === changes.themeId);
        if (theme) {
          const names = Object.keys(theme.variants);
          if (names.length > 0 && !names.includes(slot.variantName)) {
            slot.variantName = names.includes("light")
              ? "light"
              : (names[0] ?? "light");
          }
        }
      }
    },

    togglePitchSlotHidden: (state, action: { payload: number }) => {
      const index = action.payload;
      const slot = state.pitchSlots[index];
      if (slot) slot.hidden = !slot.hidden;
    },
    toggleFrameInSelection: (state, action: { payload: string }) => {
      const id = action.payload;
      const i = state.selectedFrameIds.indexOf(id);
      if (i >= 0) {
        state.selectedFrameIds = state.selectedFrameIds.filter((x) => x !== id);
      } else {
        state.selectedFrameIds = [...state.selectedFrameIds, id];
      }
    },
  },
});

export const {
  resetCanvas,
  setTransform,
  setZoom,
  addFrame,
  addFrameWithId,
  loadFrames,
  updateFrame,
  removeFrame,
  duplicateFrame,
  reorderFrames,
  setSelectedFrames,
  toggleFrameInSelection,
  updateFrameHtml,
  setTheme,
  replaceTheme,
  loadThemes,
  setActiveThemeId,
  upsertStoredTheme,
  assignThemeToFrame,
  setActiveThemeMode,
  setThemeVariantVariable,
  addThemeVariant,
  removeThemeVariant,
  addNote,
  updateNote,
  removeNote,
  setSelectedNoteId,
  loadNotes,
  setPitchPreviewFrameId,
  updatePitchSlot,
  togglePitchSlotHidden,
} = canvasSlice.actions;

export default canvasSlice.reducer;
