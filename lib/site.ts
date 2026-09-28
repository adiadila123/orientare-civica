// Set NEXT_PUBLIC_SITE_URL to the real production domain when deploying —
// this drives the sitemap, robots.txt, and canonical/OG URLs. Falls back to
// localhost so local dev and previews still produce valid (if not final) URLs.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
