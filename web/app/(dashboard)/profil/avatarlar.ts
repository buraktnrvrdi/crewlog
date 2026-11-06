export type Avatar =
  | { id: string; type: 'gradient'; gradient: [string, string]; label: string }
  | { id: string; type: 'image'; src: string; label: string }

export const AVATARLAR: Avatar[] = [
  { id: 'wings', type: 'image',    src: '/avatars/wings.png',          label: 'Kanat' },
  { id: 'star',  type: 'image',    src: '/avatars/star.png',           label: 'Yıldız' },
  { id: 'red',     type: 'gradient', gradient: ['#DC2626', '#B91C1C'], label: 'Kırmızı' },
  { id: 'orange',  type: 'gradient', gradient: ['#EA580C', '#C2410C'], label: 'Turuncu' },
  { id: 'amber',   type: 'gradient', gradient: ['#D97706', '#B45309'], label: 'Amber' },
  { id: 'lime',    type: 'gradient', gradient: ['#65A30D', '#4D7C0F'], label: 'Fıstık' },
  { id: 'emerald', type: 'gradient', gradient: ['#059669', '#047857'], label: 'Zümrüt' },
  { id: 'teal',    type: 'gradient', gradient: ['#0D9488', '#0F766E'], label: 'Teal' },
  { id: 'cyan',    type: 'gradient', gradient: ['#0891B2', '#0E7490'], label: 'Cyan' },
  { id: 'blue',    type: 'gradient', gradient: ['#2563EB', '#1D4ED8'], label: 'Mavi' },
  { id: 'indigo',  type: 'gradient', gradient: ['#4F46E5', '#4338CA'], label: 'İndigo' },
  { id: 'violet',  type: 'gradient', gradient: ['#7C3AED', '#6D28D9'], label: 'Mor' },
  { id: 'pink',    type: 'gradient', gradient: ['#DB2777', '#BE185D'], label: 'Pembe' },
  { id: 'slate',   type: 'gradient', gradient: ['#475569', '#334155'], label: 'Gri' },
]

export function avatarGradient(id: string | null | undefined): [string, string] {
  const av = AVATARLAR.find(a => a.id === id)
  if (av?.type === 'gradient') return av.gradient
  return ['#DC2626', '#B91C1C']
}

export function avatarImage(id: string | null | undefined): string | null {
  const av = AVATARLAR.find(a => a.id === id)
  if (av?.type === 'image') return av.src
  return null
}
