"use client";

import { useEffect, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { fetchProject } from "@/store/slices/projectSlice";
import { DEFAULT_PROJECT_ID } from "@/constants/project";

export function ProjectLoader({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const params = useParams();
  const projectId = (params?.projectId as string) ?? DEFAULT_PROJECT_ID;

  useEffect(() => {
    void dispatch(fetchProject(projectId));
  }, [dispatch, projectId]);

  return <>{children}</>;
}
