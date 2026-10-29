import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function productionOrigin(mode) {
  const fileEnv = loadEnv(mode, process.cwd(), "");
  const raw = fileEnv.SITE_URL || process.env.SITE_URL || fileEnv.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || fileEnv.VERCEL_URL || process.env.VERCEL_URL;
  if (!raw) return "";
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return url.protocol === "https:" ? url.origin : "";
  } catch {
    return "";
  }
}

function searchMetadata(origin, deploymentEnv) {
  const robots = deploymentEnv === "production" ? "index, follow, max-image-preview:large" : "noindex, nofollow";
  if (!origin) return `<meta name="robots" content="${robots}" />`;
  const canonical = `${origin}/`;
  const socialImage = `${origin}/devsprint-social.svg`;
  const websiteSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DevSprint",
    alternateName: "DevSprint 60-Day Developer Roadmap",
    url: canonical
  }).replace(/</g, "\\u003c");

  return `<meta name="robots" content="${robots}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${socialImage}" />
    <meta property="og:image:type" content="image/svg+xml" />
    <meta name="twitter:image" content="${socialImage}" />
    <script type="application/ld+json">${websiteSchema}</script>`;
}

export default defineConfig(({ mode }) => {
  const metadata = searchMetadata(productionOrigin(mode), process.env.VERCEL_ENV);
  return {
    plugins: [
      react(),
      {
        name: "devsprint-search-metadata",
        transformIndexHtml(html) {
          return html.replace("<!-- devsprint-seo:canonical -->", metadata);
        }
      }
    ]
  };
});
