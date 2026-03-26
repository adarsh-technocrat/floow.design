import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import http from "@/lib/http";

export interface FramePreviewItem {
  id: string;
  label: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  screens: number;
  framePreviews?: FramePreviewItem[];

  createdAt: string;
  updatedAt: string;
}

export interface TrashedProject {
  id: string;
  name: string;
  screens: number;

  trashedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  tag: string;
  screens: number;

  firstFrameHtml: string | null;
}

interface ProjectsState {
  list: ProjectListItem[];
  listLoading: boolean;
  fetched: boolean;
  trashed: TrashedProject[];
  trashLoading: boolean;
  templates: TemplateItem[];
  templatesLoading: boolean;
}

const initialState: ProjectsState = {
  list: [],
  listLoading: false,
  fetched: false,
  trashed: [],
  trashLoading: false,
  templates: [],
  templatesLoading: false,
};

export const fetchProjects = createAsyncThunk("projects/fetchAll", async () => {
  const { data } = await http.get("/api/projects");
  return (data.projects ?? []) as ProjectListItem[];
});

export const createProject = createAsyncThunk(
  "projects/create",
  async (name: string) => {
    const { data } = await http.post("/api/projects", { name });
    return data as { id?: string };
  },
);

export const trashProject = createAsyncThunk(
  "projects/trash",
  async (id: string) => {
    await http.delete("/api/projects", { data: { id } });
    return id;
  },
);

export const fetchTrashedProjects = createAsyncThunk(
  "projects/fetchTrashed",
  async () => {
    const { data } = await http.get("/api/projects/trash");
    return (data.projects ?? []) as TrashedProject[];
  },
);

export const restoreProject = createAsyncThunk(
  "projects/restore",
  async (id: string, { dispatch }) => {
    await http.post("/api/projects/trash", { id });
    dispatch(fetchProjects());
    return id;
  },
);

export const permanentlyDeleteProject = createAsyncThunk(
  "projects/permanentDelete",
  async (id: string) => {
    await http.delete("/api/projects/trash", { data: { id } });
    return id;
  },
);

export const fetchTemplates = createAsyncThunk(
  "projects/fetchTemplates",
  async () => {
    const { data } = await http.get("/api/templates");
    return (data.templates ?? []) as TemplateItem[];
  },
);

export const persistFrame = createAsyncThunk(
  "projects/persistFrame",
  async (payload: {
    frameId: string;
    html: string;
    label?: string;
    left?: number;
    top?: number;
    projectId?: string;
  }) => {
    await http.post("/api/frames", payload);
    return payload;
  },
);

export const deleteFrameFromApi = createAsyncThunk(
  "projects/deleteFrame",
  async (frameId: string) => {
    await http.delete(`/api/frames?frameId=${encodeURIComponent(frameId)}`);
    return frameId;
  },
);

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.listLoading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.list = action.payload;
        state.listLoading = false;
        state.fetched = true;
      })
      .addCase(fetchProjects.rejected, (state) => {
        state.listLoading = false;
        state.fetched = true;
      })
      .addCase(trashProject.fulfilled, (state, action) => {
        state.list = state.list.filter((p) => p.id !== action.payload);
      })
      .addCase(fetchTrashedProjects.pending, (state) => {
        state.trashLoading = true;
      })
      .addCase(fetchTrashedProjects.fulfilled, (state, action) => {
        state.trashed = action.payload;
        state.trashLoading = false;
      })
      .addCase(fetchTrashedProjects.rejected, (state) => {
        state.trashLoading = false;
      })
      .addCase(restoreProject.fulfilled, (state, action) => {
        state.trashed = state.trashed.filter((p) => p.id !== action.payload);
      })
      .addCase(permanentlyDeleteProject.fulfilled, (state, action) => {
        state.trashed = state.trashed.filter((p) => p.id !== action.payload);
      })
      .addCase(fetchTemplates.pending, (state) => {
        state.templatesLoading = true;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;
        state.templatesLoading = false;
      })
      .addCase(fetchTemplates.rejected, (state) => {
        state.templatesLoading = false;
      });
  },
});

export default projectsSlice.reducer;
