import type { AppDispatch } from "@/store";
import {
  setMainChatAgentFrame,
  type FrameOverlayType,
} from "@/store/slices/agentSlice";

const MAIN_AGENT_ID = "main";

let _dispatch: AppDispatch | null = null;

export function initCursor(dispatch: AppDispatch) {
  _dispatch = dispatch;
}

function getDispatch(): AppDispatch {
  if (!_dispatch) throw new Error("cursor not initialized — call initCursor(dispatch) first");
  return _dispatch;
}

function dispatchFrame(
  frameId: string | null,
  status: "working" | "idle",
  overlay?: FrameOverlayType,
) {
  getDispatch()(setMainChatAgentFrame({ frameId, status, overlay }));
}

export const cursor = {
  MAIN: MAIN_AGENT_ID,

  working(_agentId = MAIN_AGENT_ID) {
    dispatchFrame(null, "working");
  },

  show(_agentId: string, frameId: string) {
    dispatchFrame(frameId, "working");
  },

  scan(_agentId: string, frameId: string) {
    dispatchFrame(frameId, "working", "scan");
  },

  design(_agentId: string, frameId: string) {
    dispatchFrame(frameId, "working", "design");
  },

  hide(_agentId = MAIN_AGENT_ID) {
    dispatchFrame(null, "idle");
  },
};

export type { FrameOverlayType };
