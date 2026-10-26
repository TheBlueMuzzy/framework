import text from '../../content/text/en.json'

/** An AI personality's name for players (content/text/en.json "ai"). */
export function personalityName(id: string): string {
  const names = text.ai.personality as Record<string, { name: string } | undefined>
  return names[id]?.name ?? id
}
