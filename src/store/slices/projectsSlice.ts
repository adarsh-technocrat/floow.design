import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export interface ProjectListItem {
  id: string;
  name: string;
  screens: number;
  thumbnail: string | null;
  firstFrameHtml: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrashedProject {
  id: string;
  name: string;
  screens: number;
  thumbnail: string | null;
  trashedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  tag: string;
  screens: number;
  thumbnail: string | null;
  firstFrameHtml: string | null;
}

interface ProjectsState {
  list: ProjectListItem[];
  listLoading: boolean;
  trashed: TrashedProject[];
  trashLoading: boolean;
  templates: TemplateItem[];
  templatesLoading: boolean;
}

const initialState: ProjectsState = {
  list: [],
  listLoading: true,
  trashed: [],
  trashLoading: false,
  templates: [],
  templatesLoading: true,
};

// Fetch all active projects
export const fetchProjects = createAsyncThunk(
  "projects/fetchAll",
  async () => {
    const res = await fetch("/api/projects");
    const data = await res.json();
    return (data.projects ?? []) as ProjectListItem[];
  },
);

// Create a new project
export const createProject = createAsyncThunk(
  "projects/create",
  async (name: string) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data: { id?: string } = await res.json();
    return data;
  },
);

// Trash a project (soft delete)
export const trashProject = createAsyncThunk(
  "projects/trash",
  async (id: string) => {
    await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return id;
  },
);

// Fetch trashed projects
export const fetchTrashedProjects = createAsyncThunk(
  "projects/fetchTrashed",
  async () => {
    const res = await fetch("/api/projects/trash");
    const data = await res.json();
    return (data.projects ?? []) as TrashedProject[];
  },
);

// Restore a trashed project
export const restoreProject = createAsyncThunk(
  "projects/restore",
  async (id: string, { dispatch }) => {
    await fetch("/api/projects/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    // Refresh both lists
    dispatch(fetchProjects());
    return id;
  },
);

// Permanently delete a project
export const permanentlyDeleteProject = createAsyncThunk(
  "projects/permanentDelete",
  async (id: string) => {
    await fetch("/api/projects/trash", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return id;
  },
);

// Fetch templates
export const fetchTemplates = createAsyncThunk(
  "projects/fetchTemplates",
  async () => {
    const res = await fetch("/api/templates");
    const data = await res.json();
    return (data.templates ?? []) as TemplateItem[];
  },
);

// Save frame to API
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
    await fetch("/api/frames", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return payload;
  },
);

// Delete frame from API
export const deleteFrameFromApi = createAsyncThunk(
  "projects/deleteFrame",
  async (frameId: string) => {
    await fetch(`/api/frames?frameId=${encodeURIComponent(frameId)}`, {
      method: "DELETE",
    });
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
      })
      .addCase(fetchProjects.rejected, (state) => {
        state.listLoading = false;
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
