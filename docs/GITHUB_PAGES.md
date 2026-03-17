# Publishing to GitHub Pages

The app is set up to build and deploy to GitHub Pages via a GitHub Action.

## One-time setup in GitHub

1. Open your repo on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.

After that, every push to `main` will run the workflow, build the app, and publish the site.

### Feature flags (LaunchDarkly) on GitHub Pages

For LaunchDarkly feature flags to work on the deployed site, the build needs your **client-side ID**. Add it as a repository secret:

1. In GitHub: **Settings → Secrets and variables → Actions**.
2. **New repository secret**: name `LAUNCHDARKLY_CLIENT_ID`, value = your LaunchDarkly client-side ID (same as `VITE_LAUNCHDARKLY_CLIENT_ID` in local `.env`).
3. Re-run the deploy workflow (or push a commit). The next build will bake the ID into the app and flags will work on the GitHub Pages URL.

If this secret is not set, the app still builds and deploys; flags will use defaults and won’t reflect your LaunchDarkly targeting.

## URL

Your site will be available at:

**`https://<your-username>.github.io/<repo-name>/`**

For example, if the repo is `briannorman/time-tracking-demo`, the URL is:

**https://briannorman.github.io/time-tracking-demo/**

## What the workflow does

- Triggers on push to `main` (and can be run manually from the Actions tab).
- Installs dependencies and runs `npm run build` with the correct base path for the repo.
- Copies `index.html` to `404.html` so client-side routes (e.g. `/dashboard`) work when opened or refreshed.
- Deploys the `dist` folder to GitHub Pages.

## If your default branch is not `main`

Edit `.github/workflows/deploy-pages.yml` and change:

```yaml
on:
  push:
    branches: [main]
```

to your branch name (e.g. `master`).

## Local preview with the same base path

To test the built app as it will appear on GitHub Pages:

```bash
BASE_PATH=/time-tracking-demo/ npm run build
npm run preview
```

Then open the URL shown (and append `/time-tracking-demo/` if needed) to verify routing and assets.
