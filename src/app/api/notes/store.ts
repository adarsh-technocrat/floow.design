import { prisma, ensureProject } from "@/lib/db";

export async function setNote(
  noteId: string,
  projectId: string,
  meta: {
    text?: string;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    color?: string;
    fontSize?: number;
  },
) {
  await ensureProject(projectId);
  await prisma.note.upsert({
    where: { id: noteId },
    create: {
      id: noteId,
      projectId,
      text: meta.text ?? "",
      left: meta.left ?? 0,
      top: meta.top ?? 0,
      width: meta.width ?? 228,
      height: meta.height ?? 228,
      color: meta.color ?? "yellow",
      fontSize: meta.fontSize ?? 16,
    },
    update: {
      ...(meta.text !== undefined && { text: meta.text }),
      ...(meta.left !== undefined && { left: meta.left }),
      ...(meta.top !== undefined && { top: meta.top }),
      ...(meta.width !== undefined && { width: meta.width }),
      ...(meta.height !== undefined && { height: meta.height }),
      ...(meta.color !== undefined && { color: meta.color }),
      ...(meta.fontSize !== undefined && { fontSize: meta.fontSize }),
    },
  });
}

export async function getNotesByProject(projectId: string) {
  return prisma.note.findMany({
    where: { projectId },
    select: {
      id: true,
      text: true,
      left: true,
      top: true,
      width: true,
      height: true,
      color: true,
      fontSize: true,
    },
  });
}

export async function deleteNote(noteId: string) {
  await prisma.note.deleteMany({ where: { id: noteId } });
}
