// AVATAR — a player's picture, or their initials if there's no picture.
// active: highlighted ring (whose turn it is).
type AvatarProps = { name: string; src?: string; active?: boolean }

export function Avatar({ name, src, active }: AvatarProps) {
  const initials = name.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className="kit-avatar" data-state={active ? 'active' : undefined} role="img" aria-label={name}>
      {src ? <img src={src} alt="" /> : initials}
    </span>
  )
}
