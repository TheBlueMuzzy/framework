// Ten game tabs for kit/e2e.test.mjs — enough that a phone's tab row pages (the carousel), so a tab sits on a later page.
// (".test" in the name: install-devkit leaves it out of games.)
import type { ComponentType } from 'react'

const names = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliett']
export const gameTabs: { id: string; label: string; Panel: ComponentType }[] = names.map((label) => ({
  id: label.toLowerCase(),
  label,
  Panel: () => <p data-test-tab={label}>{label} tools</p>,
}))
