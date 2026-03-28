import { createSlice } from "@reduxjs/toolkit";

export type CanvasToolMode = "select" | "hand" | "note";

export interface AgentLogEntry {
  id: string;
  type: "user" | "agent" | "status";
  text: string;
  timestamp: number;
}

interface UIState {
  chatPanelOpen: boolean;
  canvasToolMode: CanvasToolMode;
  agentLog: AgentLogEntry[];
  agentLogVisible: boolean;
  /** Full-screen pitch board (theme comparison) on project canvas */
  pitchBoardOpen: boolean;
}

const initialState: UIState = {
  chatPanelOpen: true,
  canvasToolMode: "select",
  agentLog: [],
  agentLogVisible: true,
  pitchBoardOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setChatPanelOpen: (state, action: { payload: boolean }) => {
      state.chatPanelOpen = action.payload;
    },
    toggleChatPanel: (state) => {
      state.chatPanelOpen = !state.chatPanelOpen;
    },
    setCanvasToolMode: (state, action: { payload: CanvasToolMode }) => {
      state.canvasToolMode = action.payload;
    },
    pushAgentLog: (
      state,
      action: { payload: Omit<AgentLogEntry, "id" | "timestamp"> },
    ) => {
      state.agentLog.push({
        ...action.payload,
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
      });
    },
    clearAgentLog: (state) => {
      state.agentLog = [];
    },
    toggleAgentLogVisible: (state) => {
      state.agentLogVisible = !state.agentLogVisible;
    },
    setAgentLogVisible: (state, action: { payload: boolean }) => {
      state.agentLogVisible = action.payload;
    },
    setPitchBoardOpen: (state, action: { payload: boolean }) => {
      state.pitchBoardOpen = action.payload;
    },
  },
});

export const {
  setChatPanelOpen,
  toggleChatPanel,
  setCanvasToolMode,
  pushAgentLog,
  clearAgentLog,
  toggleAgentLogVisible,
  setAgentLogVisible,
  setPitchBoardOpen,
} = uiSlice.actions;
export default uiSlice.reducer;
