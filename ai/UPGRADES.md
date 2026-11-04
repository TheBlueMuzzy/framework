# AI — upgrade notes

Hand steps a game does when it updates this module, newest first. `install-module.mjs` prints the ones between the game's version and the new one.
Format: `- <version>: <step>` (LOOK CHANGE = sizes or looks change: re-take the game's screenshots and show Muzzy before re-recording them) · `Needs Dev Kit: <version>` = the install is refused on an older Dev Kit.

Needs Dev Kit: 0.21.0 — its checks call `t.warn`, which the Dev Kit's check runner has since 0.21.0 (older: "t.warn is not a function").

- 0.9.0: banter archived (F186 — Slimmed framework; git tag `archive/emotes-0.4.2`): `banter.ts`, `save.ts`, `settingsRow.ts`, `botBanter`, the plug's `moments` and the banter checks are gone — the update REMOVES them from src/ai/kit/. A game that calls `botBanter`, `BANTER_SAVE`, `BANTER_SETTINGS_ROWS` or `applyBanterSetting` stays on its copy (don't update), or deletes those calls (and its content/ai/banter.json, the "Bot chatter" Settings row and the banter golden save) first. `GamePlug` takes 3 type arguments now (`<View, Action, World>`). Glyphtender calls none of them.
- 0.4.0 (before the 0.9.0 archive): `chattiness` now means "this bot talks": any personality with chattiness > 0 needs banter lines in content/text/en.json, `botBanter` and the emotes module, or check:framework's "every chatty personality has lines" and "bots talk through the emote module" go red. A game from before that never used chattiness (Glyphtender's 30–70 from the Unity port): set it to 0 for silent bots, or plan a banter feature (needs the emotes module first).
