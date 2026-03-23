import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loadFrames, loadThemes, type StoredTheme } from "./canvasSlice";
import http from "@/lib/http";

export interface ProjectState {
  projectId: string | null;
  projectName: string | null;
  messages: unknown[];
  loaded: boolean;
}

const initialState: ProjectState = {
  projectId: null,
  projectName: null,
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
    const { data: res } = await http.get(`/api/project?${q.toString()}`);
    const name = typeof res?.name === "string" ? res.name : "Untitled Project";
    const frames = Array.isArray(res?.frames) ? res.frames : [];
    const messages = Array.isArray(res?.messages) ? res.messages : [];
    const themes = Array.isArray(res?.themes) ? (res.themes as StoredTheme[]) : [];
    dispatch(loadFrames(frames));
    dispatch(loadThemes(themes));
    return { projectId, name, messages };
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
        state.projectName = action.payload.name;
        state.messages = action.payload.messages;
        state.loaded = true;
      })
      .addCase(fetchProject.rejected, (state) => {
        state.loaded = true;
      });
  },
});

export default projectSlice.reducer;
