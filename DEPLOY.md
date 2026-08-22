# Deploy

## Cloudflare Pages (preferred)

1. Push repo to GitHub.
2. In Cloudflare Pages: connect the repo.
3. Build command: `npm run build`. Output directory: `dist`.
4. Deploy.

## GitHub Pages (alternative)

1. `npm run build`.
2. Publish `dist/` to `gh-pages` branch (e.g. via `gh-pages` npm package or GitHub Actions).
3. Set base path in `vite.config.ts` if hosting under a subpath.

## Offline from folder

The built `dist/` is fully static. You can serve it from any static host, LAN file share, or a USB stick with a tiny web server (e.g. `python -m http.server`). Because the app registers a service worker, once loaded it will run offline on the device.
