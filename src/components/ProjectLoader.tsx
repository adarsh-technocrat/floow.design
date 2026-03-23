"use client";

import { useEffect, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProject } from "@/store/slices/projectSlice";
import { fetchProjects } from "@/store/slices/projectsSlice";
import { fetchUserPlan } from "@/store/slices/userSlice";
import { useAuth } from "@/contexts/AuthContext";

export function ProjectLoader({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const params = useParams();
  const projectId = (params?.id ?? params?.projectId) as string | undefined;
  const { user, loading } = useAuth();
  const userId = user?.uid;
  const projectsFetched = useAppSelector((s) => s.projects.fetched);

  useEffect(() => {
    // Wait for auth to finish loading before fetching
    if (loading) return;
    if (!projectId || !userId) return;
    void dispatch(fetchProject({ projectId, userId }));
  }, [dispatch, projectId, userId, loading]);

  // Eagerly prefetch the projects list + user plan once auth is ready,
  // so the dropdown and sidebar are populated instantly
  useEffect(() => {
    if (loading || !userId) return;
    if (!projectsFetched) {
      dispatch(fetchProjects());
    }
    dispatch(fetchUserPlan(userId));
  }, [dispatch, userId, loading, projectsFetched]);

  return <>{children}</>;
}
