import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  loadFrames,
  loadNotes,
  loadThemes,
  resetCanvas,
  type StoredTheme,
} from "./canvasSlice";
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
  async ({ projectId }: { projectId: string }, { dispatch, getState }) => {
    const currentId = (getState() as { project: ProjectState }).project
      .projectId;
    if (currentId !== projectId) {
      dispatch(resetCanvas());
    }
    const q = new URLSearchParams({ id: projectId });
    const { data: res } = await http.get(`/api/project?${q.toString()}`);
    const name = typeof res?.name === "string" ? res.name : "Untitled Project";
    const frames = Array.isArray(res?.frames) ? res.frames : [];
    const notes = Array.isArray(res?.notes) ? res.notes : [];
    const messages = Array.isArray(res?.messages) ? res.messages : [];
    const themes = Array.isArray(res?.themes)
      ? (res.themes as StoredTheme[])
      : [];
    dispatch(loadFrames(frames));
    dispatch(loadNotes(notes));
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
      .addCase(fetchProject.pending, (state, action) => {
        const newId = action.meta.arg.projectId;
        if (state.projectId !== newId) {
          state.projectId = newId;
          state.projectName = null;
          state.messages = [];
          state.loaded = false;
        }
      })
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
