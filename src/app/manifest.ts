import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Memo",
    short_name: "AI Memo",
    description: "Голосовой и текстовый дневник с ИИ-анализом.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9fb",
    theme_color: "#0f7b72",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
