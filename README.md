This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## API contract

The typed API client and DTOs come from `@barbu-game/barbu-api`, published to GitHub
Packages by `barbu-server`'s release pipeline (getout pattern — drift breaks the
typecheck). Installing it needs a GitHub token with `read:packages`:

```bash
export NODE_AUTH_TOKEN=<github PAT with read:packages>
pnpm install
```

The scope is mapped to the registry in `.npmrc`; CI passes the token as
`NODE_AUTH_TOKEN`.

## Tests E2E (Playwright)

Prérequis local : `JAVA_HOME` sur un JDK 21 (Temurin). Depuis `barbu-web/` :

```bash
pnpm test:e2e        # démarre le backend (../barbu-server) + le front + Playwright
pnpm test:e2e:ui     # mode interactif
```

Playwright démarre lui-même le serveur (bots à délai 0, `BARBU_BOT_DELAY_MS=0`) et le
front ; s'ils tournent déjà (`pnpm dev` + serveur), ils sont réutilisés. En CI, le
workflow `E2E` checkout `barbu-server` (secret `SERVER_REPO_TOKEN`, lecture `contents`)
et exécute la suite en gate avant merge.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
