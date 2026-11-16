# DON’T GO

An offline, browser-local interactive drama built with React, TypeScript and Vite. The page is the character: it speaks, changes its own interface, builds small interactive worlds, reacts to browser activity, and remembers only a bounded fragment in local storage.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. The development build includes the `DEBUG \`` overlay; press the backtick key or the button in the lower-left corner to inspect seeded behavior, timers, events, reactions, mutations, and replay observations.

## GitHub Pages

Push this project to a GitHub repository. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. Then run **Deploy DON'T GO to GitHub Pages** from the Actions tab on the default branch. Later pushes to that branch deploy automatically.

`npm run build:pages` creates the static site in `dist/` with **Debug** and **Audit States** enabled for visitors. Asset URLs are relative so the same build works at a repository subpath or the domain root.

## Verification

```bash
npm test
npm run build
npm run test:e2e
```

The browser tests use a local Chrome executable when available. Set `DONT_GO_CHROMIUM` to another browser executable, or install Playwright Chromium if your machine has neither.

## Browser-local memory

Ending a conversation is irreversible for that instance. A new visit may inherit a small, bounded summary of the previous visit; no backend or network service is used. The Settings panel clears that memory.

The authored dialogue used by the app is in `src/catalog.json` and `src/content.ts`.
