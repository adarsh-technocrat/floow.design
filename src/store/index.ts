import { configureStore } from "@reduxjs/toolkit";
import canvasReducer from "./slices/canvasSlice";
import uiReducer from "./slices/uiSlice";
import projectReducer from "./slices/projectSlice";
import agentReducer from "./slices/agentSlice";
import userReducer from "./slices/userSlice";
import projectsReducer from "./slices/projectsSlice";
import teamReducer from "./slices/teamSlice";

export const store = configureStore({
  reducer: {
    canvas: canvasReducer,
    ui: uiReducer,
    project: projectReducer,
    agent: agentReducer,
    user: userReducer,
    projects: projectsReducer,
    team: teamReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
