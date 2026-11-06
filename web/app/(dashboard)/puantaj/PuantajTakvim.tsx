'use client'

import { useState, useEffect } from 'react'
import { puantajAylikOzet } from '@/app/actions/puantaj'

type Santiye = { id: string; name: string }

type Props = {
  companyId: string
  santiyeler: Santiye[]
  onTarihSec: (tarih: string) => void
  secilenTarih: string
}

const GUN_BASLIKLARI = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

function padDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function PuantajTakvim({ companyId, santiyeler, onTarihSec, secilenTarih }: Props) {
  const now = new Date()
  const [seciliSantiyeId, setSeciliSantiyeId] = useState(santiyeler[0]?.id ?? '')
  const [yil, setYil] = useState(now.getFullYear())
  const [ay, setAy] = useState(now.getMonth() + 1)
  const [kayitliGunler, setKayitliGunler] = useState<string[]>([])
  const [yukleniyor, setYukleniyor] = useState(false)

  const bugunStr = now.toISOString().split('T')[0]
  const bugunYil = now.getFullYear()
  const bugunAy = now.getMonth() + 1

  useEffect(() => {
    if (!seciliSantiyeId) return
    setYukleniyor(true)
    puantajAylikOzet(companyId, seciliSantiyeId, yil, ay).then((gunler) => {
      setKayitliGunler(gunler)
      setYukleniyor(false)
    })
  }, [companyId, seciliSantiyeId, yil, ay])

  function oncekiAy() {
    if (ay === 1) {
      setAy(12)
      setYil(y => y - 1)
    } else {
      setAy(a => a - 1)
    }
  }

  function sonrakiAy() {
    if (yil > bugunYil || (yil === bugunYil && ay >= bugunAy)) return
    if (ay === 12) {
      setAy(1)
      setYil(y => y + 1)
    } else {
      setAy(a => a + 1)
    }
  }

  const ilkGun = new Date(yil, ay - 1, 1)
  // Monday-based: getDay() returns 0=Sun,1=Mon... convert: Mon=0,Tue=1,...Sun=6
  const ilkGunHaftaici = (ilkGun.getDay() + 6) % 7
  const aySonuGun = new Date(yil, ay, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < ilkGunHaftaici; i++) cells.push(null)
  for (let d = 1; d <= aySonuGun; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const ayAdi = new Date(yil, ay - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
  const isNextDisabled = yil > bugunYil || (yil === bugunYil && ay >= bugunAy)

  return (
    <div className="glass-card p-6">
      {/* Santiye seçimi */}
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <select
          value={seciliSantiyeId}
          onChange={e => setSeciliSantiyeId(e.target.value)}
          className="glass rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass bg-transparent"
        >
          {santiyeler.map(s => (
            <option key={s.id} value={s.id} className="bg-[#0a0a0a] text-white">{s.name}</option>
          ))}
        </select>

        {/* Ay navigasyon */}
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={oncekiAy}
            className="glass rounded-xl w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-glass text-lg"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-white capitalize min-w-[140px] text-center">{ayAdi}</span>
          <button
            onClick={sonrakiAy}
            disabled={isNextDisabled}
            className="glass rounded-xl w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-glass text-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
      </div>

      {/* Yükleniyor */}
      {yukleniyor && (
        <div className="text-center py-4 text-sm text-[#94A3B8]">Yükleniyor...</div>
      )}

      {!yukleniyor && (
        <>
          {/* Gün başlıkları */}
          <div className="grid grid-cols-7 mb-2">
            {GUN_BASLIKLARI.map(g => (
              <div key={g} className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest py-1">
                {g}
              </div>
            ))}
          </div>

          {/* Günler */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((gun, idx) => {
              if (gun === null) return <div key={idx} />
              const dateStr = padDate(yil, ay, gun)
              const isToday = dateStr === bugunStr
              const isSelected = dateStr === secilenTarih
              const isFuture = dateStr > bugunStr
              const hasRecord = kayitliGunler.includes(dateStr)

              return (
                <button
                  key={idx}
                  disabled={isFuture}
                  onClick={() => !isFuture && onTarihSec(dateStr)}
                  className={`
                    relative flex flex-col items-center justify-center rounded-xl py-2 text-sm font-medium transition-glass
                    ${isFuture ? 'opacity-30 cursor-not-allowed text-white/40' : 'cursor-pointer hover:bg-white/[0.08]'}
                    ${isSelected ? 'bg-orange-500 text-white' : 'text-white'}
                    ${isToday && !isSelected ? 'ring-1 ring-orange-500' : ''}
                  `}
                >
                  {gun}
                  {hasRecord && (
                    <span
                      className="mt-0.5 w-1 h-1 rounded-full"
                      style={{ background: isSelected ? 'white' : '#10B981' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
