# PILEPIT website

Sorani Kurdish, RTL, single-page Astro website. Static output; no server or adapter required.

## Local development

Use Node.js 22.12+ (Node 22 recommended).

```sh
npm ci
npm run dev
```

## Cloudflare Pages

Connect this GitHub repository in Workers & Pages → Create → Pages → Import an existing Git repository.

- Production branch: `main`
- Framework: Astro
- Root directory: leave empty
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION=22`

Save and deploy. Cloudflare provides a pages.dev URL and rebuilds on pushes. Add your domain in Custom domains after deployment.

## Launch

Store buttons currently announce that the app is coming soon. Replace them with actual store links once the app is released. Screenshots are from the app golden images; refresh them before launch if the app UI changes. Fonts and their OFL license are bundled locally. Set a canonical URL, absolute social preview image, and sitemap after the production domain is known.

## Verification

```sh
npm run build
npm run preview
```
