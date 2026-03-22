"use client";

import { useState } from "react";
import { generateUserAvatar } from "@/lib/avatar";

interface AvatarProps {
  src?: string | null;
  email?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ src, email, name, size = 32, className = "" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const fallbackSrc = generateUserAvatar(email, name, { size });
  const displaySrc = src && !imgError ? src : fallbackSrc;

  return (
    <img
      src={displaySrc}
      alt={name || email || "User"}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={() => setImgError(true)}
    />
  );
}
