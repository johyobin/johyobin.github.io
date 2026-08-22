# Organize canonical content by collection and preserve legacy URLs

The Atlas site will use format-based canonical collections at `/notes/`, `/labs/`, `/cases/`, and `/tech-map/`, while Kedzie Dev Atlas provides cross-collection discovery by technical domain. Existing individual slugs will be retained beneath their new collection paths, and every old public URL will remain as a Hugo alias indefinitely because GitHub Pages cannot supply server-side redirects.

## Consequences

- Each resource has one canonical Collection URL even when it belongs to several Atlas Landmarks.
- Hugo-generated alias pages and canonical metadata preserve old bookmarks and search links; internal links and the sitemap point only to new canonical URLs.
- Operational Cases are independent portfolio pages that summarize decisions and link to supporting Operational Notes and Incident Labs rather than copying them.
