import type { MetadataRoute } from "next";

// Web App Manifest (PWA / "add to home screen"). Next auto-emits the
// <link rel="manifest"> tag. Icons referenced here live in public/.
// background/theme match the site canvas (#ffffff, see app/globals.css).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "H3",
    short_name: "H3",
    description: "내화학 설비, 설계부터 시공까지",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
