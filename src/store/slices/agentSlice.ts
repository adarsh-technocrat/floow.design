import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type FrameOverlayType = "scan" | "design" | null;
export type MainChatAgentStatus = "idle" | "working";

interface AgentState {
  mainChatActiveFrameId: string | null;
  mainChatActiveOverlay: FrameOverlayType;
  mainChatStatus: MainChatAgentStatus;
}

const initialState: AgentState = {
  mainChatActiveFrameId: null,
  mainChatActiveOverlay: null,
  mainChatStatus: "idle",
};

const agentSlice = createSlice({
  name: "agent",
  initialState,
  reducers: {
    setMainChatAgentFrame(
      state,
      action: PayloadAction<{
        frameId: string | null;
        status?: MainChatAgentStatus;
        overlay?: FrameOverlayType;
      }>,
    ) {
      const { frameId, status, overlay } = action.payload;
      if (frameId !== undefined) state.mainChatActiveFrameId = frameId;
      if (status !== undefined) state.mainChatStatus = status;
      if (overlay !== undefined) state.mainChatActiveOverlay = overlay;
      if (frameId === null) state.mainChatActiveOverlay = null;
    },
    resetAgentState(state) {
      state.mainChatActiveFrameId = null;
      state.mainChatActiveOverlay = null;
      state.mainChatStatus = "idle";
    },
  },
});

export const { setMainChatAgentFrame, resetAgentState } = agentSlice.actions;
export default agentSlice.reducer;
