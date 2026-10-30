import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VITA — academia",
    short_name: "VITA",
    description: "Treinos, hidratação, suplementos e nutrição em um só lugar.",
    start_url: "/hoje",
    scope: "/",
    display: "standalone",
    background_color: "#102534",
    theme_color: "#102534",
    icons: [
      { src: "/vita-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/vita-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
