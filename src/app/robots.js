export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://easymess.vercel.app/sitemap.xml",
  };
}
