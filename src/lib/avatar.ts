import { createAvatar } from "@dicebear/core";
import { openPeeps } from "@dicebear/collection";

interface AvatarOptions {
  size?: number;
}

export function generateAvatar(seed: string, options?: AvatarOptions): string {
  const avatar = createAvatar(openPeeps, {
    seed,
    size: options?.size ?? 128,
    face: ["smile", "smileBig"],
  });
  return avatar.toDataUri();
}

export function generateUserAvatar(
  email?: string | null,
  name?: string | null,
  options?: AvatarOptions,
): string {
  const seed = email || name || "anonymous";
  return generateAvatar(seed, options);
}
