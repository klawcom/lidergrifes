<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Catalog reads go through server functions in src/lib/catalog.functions.ts using a publishable-key client; orders are created only via createOrder (server-priced, admin client) — prices must never come from the browser.
- Product images live in public/produtos as WebP with a "-sm" 384px variant; keep that naming so srcSet helpers in src/lib/format.ts work.
