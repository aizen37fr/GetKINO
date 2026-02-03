# How to Deploy "What to Watch"

## Option 1: Vercel (Recommended)
1.  Create a [Vercel account](https://vercel.com).
2.  Install Vercel CLI:
    ```bash
    npm install -g vercel
    ```
3.  Run deploy command in this folder:
    ```bash
    vercel
    ```
4.  Follow the prompts:
    - Set up and deploy? **Yes**
    - Scope: **(Select your account)**
    - Link to existing project? **No**
    - Project Name: **what-to-watch**
    - Directory: **./** (default)
    - Build Command: `npm run build` (default is correct)
    - Output Directory: `dist` (default is correct)

5.  **Environment Variables**:
    Go to your Vercel Project Dashboard -> Settings -> Environment Variables and add:
    - `VITE_SUPABASE_URL`: `https://mlgwkrkipbarmrohwdon.supabase.co`
    - `VITE_SUPABASE_ANON_KEY`: `sb_publishable_jjtX_bMQGKGJQaACWXXXTA_M02r6mIH`

## Option 2: Netlify
1.  Drag and drop the `dist/` folder (created after `npm run build`) to [Netlify Drop](https://app.netlify.com/drop).
2.  Or use CLI: `npx netlify-cli deploy --prod`.
3.  **Live Site:** [https://getkino.netlify.app](https://getkino.netlify.app)

## Option 3: GitHub Pages
1.  Update `vite.config.ts`: Set `base: '/repo-name/'`.
2.  Run `npm run build`.
3.  Push `dist` folder to `gh-pages` branch.
