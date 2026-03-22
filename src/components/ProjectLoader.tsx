"use client";

import { useEffect, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { fetchProject } from "@/store/slices/projectSlice";
import { DEFAULT_PROJECT_ID } from "@/constants/project";
import { ANONYMOUS_USER_ID } from "@/constants/user";
import { useAuth } from "@/contexts/AuthContext";

export function ProjectLoader({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const params = useParams();
  const projectId = (params?.projectId as string) ?? DEFAULT_PROJECT_ID;
  const { user } = useAuth();
  const userId = user?.uid ?? ANONYMOUS_USER_ID;

  useEffect(() => {
    void dispatch(fetchProject({ projectId, userId }));
  }, [dispatch, projectId, userId]);

  return <>{children}</>;
}
