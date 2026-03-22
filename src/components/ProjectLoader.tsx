"use client";

import { useEffect, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { fetchProject } from "@/store/slices/projectSlice";
import { useAuth } from "@/contexts/AuthContext";

export function ProjectLoader({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const params = useParams();
  const projectId = params?.projectId as string | undefined;
  const { user } = useAuth();
  const userId = user?.uid;

  useEffect(() => {
    if (!projectId || !userId) return;
    void dispatch(fetchProject({ projectId, userId }));
  }, [dispatch, projectId, userId]);

  return <>{children}</>;
}
