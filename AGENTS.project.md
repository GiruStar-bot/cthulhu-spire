# cthulhu-spire standing orders

## GitHub (mandatory)

Repo: [GiruStar-bot/cthulhu-spire](https://github.com/GiruStar-bot/cthulhu-spire)  
Owner: `GiruStar-bot` · repo: `cthulhu-spire` · branch: `main`

**After every feature, asset, or logic update, commit and push to this GitHub repo before telling the user the work is done.** Do not wait to be asked. The user has repeated this standing order; skipping it is a defect.

How:

- `gh` is authenticated as `GiruStar-bot`.
- This sandbox `/workspace` is often **not** a git checkout. Clone or fetch `GiruStar-bot/cthulhu-spire`, copy the changed files, commit, `git push origin main`.
- Do **not** commit `node_modules/`, `/workspace/attachments/`, sandbox screenshots, `.env`, or secrets.
- Binary art under `public/art/` **does** belong in the repo when it is used by the game.
- If push fails, say so in the reply. Do not silently skip.

Commit messages: short, present-tense, what changed.
