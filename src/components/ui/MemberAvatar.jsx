"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getOptimizedImageUrl } from "@/lib/image-utils";

export default function MemberAvatar({
  src,
  name = "Member",
  size = 36,
  className = "",
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initial = name ? name[0].toUpperCase() : "?";
  const sizePx = `${size}px`;

  if (!src || hasError) {
    return (
      <span
        style={{ width: sizePx, height: sizePx, fontSize: Math.max(10, Math.floor(size * 0.38)) }}
        className={`flex shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50 font-bold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 ${className}`}
      >
        {initial}
      </span>
    );
  }

  const optimizedSrc = getOptimizedImageUrl(src, { width: 160, height: 160 });

  return (
    <Image
      src={optimizedSrc}
      alt={name}
      width={size}
      height={size}
      onError={() => setHasError(true)}
      unoptimized={typeof src === "string" && src.startsWith("http")}
      style={{ width: sizePx, height: sizePx }}
      className={`rounded-full object-cover border-2 border-amber-200/80 dark:border-amber-800/50 shadow-sm shrink-0 ${className}`}
    />
  );
}
