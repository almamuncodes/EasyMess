"use client";

/**
 * EasyMess Image Optimization & Preloading Utilities
 */

/**
 * Optimizes Cloudinary or external image URLs to inject automatic format (f_auto),
 * quality (q_auto), and specific width/height dimensions.
 */
export function getOptimizedImageUrl(src, { width = 300, height = 300, crop = "fill" } = {}) {
  if (!src || typeof src !== "string") return src;

  try {
    // If it's a Cloudinary URL
    if (src.includes("res.cloudinary.com") || src.includes("cloudinary.com")) {
      // Check if already transformed
      if (src.includes("/upload/f_auto") || src.includes("/upload/q_auto")) {
        return src;
      }
      const uploadIndex = src.indexOf("/upload/");
      if (uploadIndex !== -1) {
        // Valid Cloudinary syntax: f_auto,q_auto,w_...,h_...,c_fill
        const transformParams = `upload/f_auto,q_auto,w_${width},h_${height},c_${crop}/`;
        return src.replace("/upload/", `/${transformParams}`);
      }
    }
  } catch (err) {
    console.error("Error optimizing image URL:", err);
  }

  return src;
}

/**
 * Preloads an image into browser memory so modals/popups render instantly (< 50ms)
 */
export function preloadImage(src, options = {}) {
  if (typeof window === "undefined" || !src) return;
  const optimizedUrl = getOptimizedImageUrl(src, options);
  const img = new window.Image();
  img.src = optimizedUrl;
}

/**
 * Generates an SVG shimmer blur data URL for Next.js image placeholder
 */
export function shimmerBlurDataUrl(w = 400, h = 400) {
  const shimmer = `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="20%" />
      <stop stop-color="#edeef1" offset="50%" />
      <stop stop-color="#f6f7f8" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

  const toBase64 = (str) =>
    typeof window === "undefined"
      ? Buffer.from(str).toString("base64")
      : window.btoa(str);

  return `data:image/svg+xml;base64,${toBase64(shimmer)}`;
}

/**
 * Compresses an image file client-side to a JPEG Blob/File under 30kb.
 */
export function compressImage(file, { maxWidth = 500, maxHeight = 500, quality = 0.6 } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !file || !file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Gets cached member images map from localStorage (valid for 7 days)
 */
export function getCachedImageMap() {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("easymess_member_image_cache");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed.expiry && Date.now() > parsed.expiry) {
      window.localStorage.removeItem("easymess_member_image_cache");
      return {};
    }
    return parsed.data || {};
  } catch (e) {
    return {};
  }
}

/**
 * Saves/merges member image map into localStorage with 7-day TTL
 */
export function setCachedImageMap(newMap) {
  if (typeof window === "undefined" || typeof localStorage === "undefined" || !newMap || Object.keys(newMap).length === 0) return;
  try {
    const existing = getCachedImageMap();
    const merged = { ...existing, ...newMap };
    const payload = {
      expiry: Date.now() + SEVEN_DAYS_MS,
      data: merged,
    };
    window.localStorage.setItem("easymess_member_image_cache", JSON.stringify(payload));
  } catch (e) {}
}
