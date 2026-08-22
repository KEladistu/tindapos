# Deploy

TindaPOS is a static PWA — any static host works.

## Cloudflare Pages (preferred)

1. Push repo to GitHub.
2. Cloudflare dashboard → Pages → Create → Connect your repo.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy. Custom domain: Pages → Custom domains.

## GitHub Pages (Actions)

Add `.github/workflows/pages.yml`:

```yaml
name: Deploy
on: { push: { branches: [main] } }
permissions: { pages: write, id-token: write, contents: read }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: ${{ steps.deploy.outputs.page_url }} }
    steps:
      - id: deploy
        uses: actions/deploy-pages@v4
```

## Self-host from a folder

```
npm run build
# serve dist/ with anything:
npx serve dist
# or:
python -m http.server -d dist 8080
# or nginx / caddy / lighttpd
```

Or, from an installed PWA: Settings → Data → Export self-host zip → unzip → serve.
