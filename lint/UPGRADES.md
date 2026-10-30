# Lint — upgrade notes

Hand steps a game does when it updates this module, newest first. `install-module.mjs` prints the ones between the game's version and the new one.
Format: `- <version>: <step>` (LOOK CHANGE = sizes or looks change: re-take the game's screenshots and show Muzzy before re-recording them) · `Needs Dev Kit: <version>` = the install is refused on an older Dev Kit.

Needs Dev Kit: 0.21.0 — its checks call `t.warn`, which the Dev Kit's check runner has since 0.21.0.

- 0.4.0: no step needed: a `// text-ok` on a line inside a `check…` helper or a `…Problem(s)` list can go.
- 0.3.2: a game that took lint ≤ 0.3.1 with a `//` comment inside its eslint config list may have a comma inside a word there (Glyphtender: `re,actRefresh.configs.vite` → "re is not defined"): fix that line by hand — the installer no longer does it.
