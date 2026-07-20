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
