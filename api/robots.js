import { seoSiteUrl } from "../server/reminder-services.js";

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method not allowed");
  try {
    const origin = seoSiteUrl();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
      return res.status(200).send("User-agent: *\nDisallow: /\n");
    }
    return res.status(200).send(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`);
  } catch {
    return res.status(503).send("The site URL is not configured.");
  }
}
