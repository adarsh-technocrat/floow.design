import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loadFrames } from "./canvasSlice";

export interface ProjectState {
  projectId: string | null;
  messages: unknown[];
  loaded: boolean;
}

const initialState: ProjectState = {
  projectId: null,
  messages: [],
  loaded: false,
};

export const fetchProject = createAsyncThunk(
  "project/fetch",
  async (
    { projectId, userId }: { projectId: string; userId: string },
    { dispatch },
  ) => {
    const q = new URLSearchParams({ id: projectId, userId });
    const res = await fetch(`/api/project?${q.toString()}`).then((r) =>
      r.json(),
    );
    const frames = Array.isArray(res?.frames) ? res.frames : [];
    const messages = Array.isArray(res?.messages) ? res.messages : [];
    // Always dispatch loadFrames — clears stale frames from previous project
    dispatch(loadFrames(frames));
    return { projectId, messages };
  },
);

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.projectId = action.payload.projectId;
        state.messages = action.payload.messages;
        state.loaded = true;
      })
      .addCase(fetchProject.rejected, (state) => {
        state.loaded = true;
      });
  },
});

export default projectSlice.reducer;
