import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: `npm run build` writes plain HTML/CSS/JS to `out/`.
  output: "export",
  // Emit /table/7/index.html so any static file host can serve every route.
  trailingSlash: true,
  // Cache Components is left off on purpose: it can't be combined with a
  // static export, and this app has no server data to cache anyway.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
