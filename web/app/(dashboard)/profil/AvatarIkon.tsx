/* SVG avatar icons — 6 geometric marks on dark circle background */
import React from 'react'

type Props = {
  id: string | null | undefined
  size?: number
  className?: string
  style?: React.CSSProperties
}

/* ── Icon paths ───────────────────────────────────────────────── */

function I01() {
  /* Interlocked chain links — stylized double-loop */
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top-left rounded rect link (outline) */}
      <rect x="14" y="14" width="44" height="30" rx="10" fill="none" stroke="#DC2626" strokeWidth="10"/>
      {/* Bottom-right rounded rect link (outline) */}
      <rect x="42" y="56" width="44" height="30" rx="10" fill="none" stroke="#DC2626" strokeWidth="10"/>
      {/* Overlap mask — dark cutout in center */}
      <rect x="42" y="38" width="18" height="18" fill="#1a1a1a"/>
      {/* Re-draw top link's bottom stroke over the gap */}
      <path d="M42 39 L60 39" stroke="#DC2626" strokeWidth="10" strokeLinecap="round"/>
      {/* Re-draw bottom link's top stroke over the gap */}
      <path d="M42 61 L60 61" stroke="#DC2626" strokeWidth="10" strokeLinecap="round"/>
    </svg>
  )
}

function I02() {
  /* Three diagonal speed bars */
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="38" y="12" width="34" height="13" rx="6.5" fill="#DC2626" transform="rotate(-32 38 12)"/>
      <rect x="29" y="33" width="40" height="13" rx="6.5" fill="#DC2626" transform="rotate(-32 29 33)"/>
      <rect x="20" y="54" width="34" height="13" rx="6.5" fill="#DC2626" transform="rotate(-32 20 54)"/>
    </svg>
  )
}

function I03() {
  /* 4-blade pinwheel */
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {[0, 90, 180, 270].map(r => (
        <path
          key={r}
          d="M50 50 Q50 24 64 18 Q76 12 72 28 Q68 40 50 50 Z"
          fill="#DC2626"
          transform={`rotate(${r} 50 50)`}
        />
      ))}
    </svg>
  )
}

function I04() {
  /* Wings / chevron */
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left wing */}
      <path d="M50 44 L18 26 Q12 22 14 30 L22 48 Q24 54 32 52 L46 56 Z" fill="#DC2626"/>
      {/* Right wing */}
      <path d="M50 44 L82 26 Q88 22 86 30 L78 48 Q76 54 68 52 L54 56 Z" fill="#DC2626"/>
      {/* Center notch gap */}
      <path d="M42 70 L50 56 L58 70 L50 66 Z" fill="#DC2626"/>
    </svg>
  )
}

function I05() {
  /* Nested rotated squares / diamonds */
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer diamond outline */}
      <rect x="22" y="22" width="56" height="56" rx="6" fill="none" stroke="#DC2626" strokeWidth="9" transform="rotate(45 50 50)"/>
      {/* Inner diamond outline */}
      <rect x="34" y="34" width="32" height="32" rx="4" fill="none" stroke="#DC2626" strokeWidth="7" transform="rotate(45 50 50)"/>
    </svg>
  )
}

function I06() {
  /* 6-arm star with forked tips */
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {[0, 60, 120, 180, 240, 300].map(r => (
        <g key={r} transform={`rotate(${r} 50 50)`}>
          {/* Arm shaft */}
          <rect x="46" y="18" width="8" height="22" rx="4" fill="#DC2626"/>
          {/* Fork left */}
          <rect x="40" y="14" width="8" height="16" rx="4" fill="#DC2626" transform="rotate(-25 44 22)"/>
          {/* Fork right */}
          <rect x="52" y="14" width="8" height="16" rx="4" fill="#DC2626" transform="rotate(25 56 22)"/>
        </g>
      ))}
    </svg>
  )
}

const ICON_MAP: Record<string, () => React.ReactElement> = {
  i01: I01,
  i02: I02,
  i03: I03,
  i04: I04,
  i05: I05,
  i06: I06,
}

export default function AvatarIkon({ id, size = 36, className = '', style }: Props) {
  const resolved = id && ICON_MAP[id] ? id : 'i01'
  const IconComp = ICON_MAP[resolved]

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size, background: '#1a1a1a', ...style }}
    >
      <div style={{ width: size * 0.65, height: size * 0.65 }}>
        <IconComp />
      </div>
    </div>
  )
}
