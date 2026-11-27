# SEO, answer-engine readiness and performance audit

> **Status 2026-11-14:** indexing is open. The `noindex` of the first launch was removed on 2026-11-02 (commit `dcb8d79`);
> the pages carry no robots meta and no `X-Robots-Tag` (only the 404 page and the invite page `/invite/` of ADR 0080 keep `noindex`; the invite page is not in the sitemap). `robots.txt` allows everything and names the
> sitemap, which lists the home page and the three legal pages (`/privacy/`, `/terms/`, `/delete-account/`). The domain property is
> verified in Google Search Console; indexing was requested for the home, privacy and terms pages on 2026-11-13 because Google's
> stored copy still dated from the `noindex` days. The "Launch checklist" below is therefore done except step 3 (store links). The
> text under it is the audit of 2026-10-22 and is kept as written.

Date: 2026-10-22. Lighthouse mobile simulation against local production preview, not a live PageSpeed Insights or field-data result.

| Category | Before | After |
| --- | ---: | ---: |
| Performance | 75 | 100 |
| Accessibility | 93 | 100 |
| Best Practices | 100 | 100 |
| SEO | 63 | 69 |

SEO is intentionally limited by noindex. All other scored SEO checks passed. No promise of rankings, AI citations, or rich results is made. No ratings, offers, download URLs, or release dates were invented.

## Measured metrics

- Largest Contentful Paint: 8.0 s → 1.9 s
- Cumulative Layout Shift: 0.001 → 0
- Total Blocking Time: 0 ms → 0 ms
- Avoids enormous network payloads: Total size was 2,079 KiB → Total size was 203 KiB

## Implemented

- Responsive WebP screenshots, asynchronous decoding and lazy loading below the fold.
- WOFF2 local fonts, preloaded text fonts and immutable caching on versioned assets.
- Canonical production URL, Open Graph/Twitter metadata and generated social image.
- WebSite, MobileApplication and visible FAQ JSON-LD; semantic HTML and real product facts.
- Descriptive llms.txt (experimental convention, not a crawler access control).
- Sitemap prepared, not advertised in robots.txt or submitted while indexing is disabled.
- Standalone static 404 page and explicit indexing protection in HTML and global HTTP header.

## Launch checklist

1. Remove noindex/nofollow/noarchive from both page metadata and public/_headers only when the owner requests indexing.
2. Add Sitemap: https://pelepit.com/sitemap.xml to robots.txt and submit Search Console. Keep crawling allowed so robots can read noindex before launch.
3. Add actual store links and release details; update structured data only with verified facts.
4. Validate live performance and structured data after Cloudflare deploy. Previously indexed URLs may take time to disappear.
