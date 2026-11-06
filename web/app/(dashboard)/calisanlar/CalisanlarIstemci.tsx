'use client'

import { useState } from 'react'
import { yetkiGetir, yetkiGuncelle, VARSAYILAN_FOREMAN, VARSAYILAN_WORKER, type Permissions } from '@/app/actions/yetkiler'

type Calisan = {
  id: string
  full_name: string
  role: string | null
  avatar_color: string | null
}

const ROL_LABEL: Record<string, string> = {
  owner: 'Kurucu',
  admin: 'Yönetici',
  foreman: 'Şef / Ustabaşı',
  worker: 'Çalışan',
}

const ROL_RENK: Record<string, string> = {
  owner: 'bg-[#F43F5E]/10 text-[#F43F5E]',
  admin: 'bg-[#F43F5E]/10 text-[#F43F5E]',
  foreman: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  worker: 'bg-[#10B981]/10 text-[#10B981]',
}

const YETKI_GRUPLARI: { baslik: string; yetkiler: { key: keyof Permissions; label: string; aciklama: string }[] }[] = [
  {
    baslik: 'İş Gücü',
    yetkiler: [
      { key: 'isci_goruntule', label: 'İşçi listesini görüntüle', aciklama: 'Şirketteki tüm işçileri görebilir' },
      { key: 'isci_duzenle', label: 'İşçi ekle / düzenle', aciklama: 'Yeni işçi ekleyebilir, bilgilerini güncelleyebilir' },
      { key: 'isci_sil', label: 'İşçi sil', aciklama: 'İşçi kaydını silebilir' },
    ],
  },
  {
    baslik: 'Şantiyeler',
    yetkiler: [
      { key: 'santiye_goruntule', label: 'Şantiye listesini görüntüle', aciklama: 'Tüm şantiyeleri görebilir' },
      { key: 'santiye_duzenle', label: 'Şantiye ekle / düzenle', aciklama: 'Yeni şantiye ekleyebilir, bilgilerini güncelleyebilir' },
      { key: 'santiye_sil', label: 'Şantiye sil', aciklama: 'Şantiye kaydını silebilir' },
    ],
  },
  {
    baslik: 'Puantaj & QR',
    yetkiler: [
      { key: 'puantaj_goruntule', label: 'Puantajı görüntüle', aciklama: 'Tüm puantaj kayıtlarına erişebilir' },
      { key: 'puantaj_gir', label: 'Puantaj girişi yap', aciklama: 'Manuel puantaj kaydı oluşturabilir' },
      { key: 'qr_tara', label: 'QR ile giriş/çıkış tara', aciklama: 'Mobilde QR tarama ekranını kullanabilir' },
    ],
  },
  {
    baslik: 'İşçi Detayları',
    yetkiler: [
      { key: 'avans_goruntule', label: 'Avansları görüntüle', aciklama: 'İşçilerin avans kayıtlarını görebilir' },
      { key: 'avans_yonet', label: 'Avans ekle / düzenle', aciklama: 'Avans kaydı oluşturabilir ve düzenleyebilir' },
      { key: 'belge_goruntule', label: 'Belgeleri görüntüle', aciklama: 'İşçilere ait belgeleri görebilir' },
      { key: 'belge_yonet', label: 'Belge ekle / sil', aciklama: 'Belge yükleyebilir ve silebilir' },
      { key: 'sgk_goruntule', label: 'SGK bilgilerini görüntüle', aciklama: 'İşçilerin SGK kayıtlarına erişebilir' },
    ],
  },
  {
    baslik: 'Finans',
    yetkiler: [
      { key: 'harcama_goruntule', label: 'Harcamaları görüntüle', aciklama: 'Şantiye harcamalarını görebilir' },
      { key: 'harcama_ekle', label: 'Harcama ekle', aciklama: 'Yeni harcama kaydı girebilir' },
      { key: 'bordro_goruntule', label: 'Bordroyu görüntüle', aciklama: 'Tüm işçilerin bordro hesaplamalarına erişebilir' },
    ],
  },
  {
    baslik: 'Yönetim',
    yetkiler: [
      { key: 'rapor_goruntule', label: 'Raporları görüntüle', aciklama: 'Analiz ve rapor sayfasına erişebilir' },
      { key: 'davet_olustur', label: 'Davet kodu oluştur', aciklama: 'Şirkete yeni kullanıcı davet edebilir' },
    ],
  },
]

function avatarRenk(renk: string | null) {
  const renkler: Record<string, [string, string]> = {
    red: ['#DC2626', '#7F1D1D'],
    blue: ['#3B82F6', '#1E3A5F'],
    green: ['#10B981', '#064E3B'],
    purple: ['#8B5CF6', '#3B0764'],
    orange: ['#F97316', '#7C2D12'],
    pink: ['#EC4899', '#831843'],
  }
  const [from, to] = renkler[renk ?? 'red'] ?? renkler.red
  return { from, to }
}

export default function CalisanlarIstemci({ calisanlar }: { calisanlar: Calisan[] }) {
  const [seciliCalisan, setSeciliCalisan] = useState<Calisan | null>(null)
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [kaydediyor, setKaydediyor] = useState(false)
  const [basarili, setBasarili] = useState(false)

  async function yetkiAc(calisan: Calisan) {
    setSeciliCalisan(calisan)
    setYukleniyor(true)
    setBasarili(false)
    const mevcut = await yetkiGetir(calisan.id)
    if (mevcut) {
      setPermissions(mevcut)
    } else {
      setPermissions(calisan.role === 'foreman' ? { ...VARSAYILAN_FOREMAN } : { ...VARSAYILAN_WORKER })
    }
    setYukleniyor(false)
  }

  function kapat() {
    setSeciliCalisan(null)
    setPermissions(null)
    setBasarili(false)
  }

  function toggle(key: keyof Permissions) {
    if (!permissions) return
    setPermissions({ ...permissions, [key]: !permissions[key] })
  }

  function tumunuAc() {
    if (!permissions) return
    const hepsi = Object.keys(permissions).reduce((acc, k) => ({ ...acc, [k]: true }), {} as Permissions)
    setPermissions(hepsi)
  }

  function tumunuKapat() {
    if (!permissions) return
    const hicbiri = Object.keys(permissions).reduce((acc, k) => ({ ...acc, [k]: false }), {} as Permissions)
    setPermissions(hicbiri)
  }

  function varsayilanaDonus() {
    if (!seciliCalisan) return
    setPermissions(seciliCalisan.role === 'foreman' ? { ...VARSAYILAN_FOREMAN } : { ...VARSAYILAN_WORKER })
  }

  async function kaydet() {
    if (!seciliCalisan || !permissions) return
    setKaydediyor(true)
    const result = await yetkiGuncelle(seciliCalisan.id, permissions)
    setKaydediyor(false)
    if (!result.error) {
      setBasarili(true)
      setTimeout(() => setBasarili(false), 2500)
    }
  }

  const aktifSayisi = permissions ? Object.values(permissions).filter(Boolean).length : 0
  const toplamSayisi = permissions ? Object.keys(permissions).length : 0

  return (
    <>
      {/* Kullanıcı listesi */}
      {calisanlar.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-white/40 text-sm">Henüz şirkete katılmış başka kullanıcı yok</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="divide-y divide-white/[0.06]">
            {calisanlar.map(calisan => {
              const { from, to } = avatarRenk(calisan.avatar_color)
              const initial = calisan.full_name?.charAt(0)?.toUpperCase() ?? '?'
              return (
                <div key={calisan.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                    >
                      {initial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{calisan.full_name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 inline-block ${ROL_RENK[calisan.role ?? ''] ?? 'bg-white/5 text-white/40'}`}>
                        {ROL_LABEL[calisan.role ?? ''] ?? calisan.role ?? 'Belirsiz'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => yetkiAc(calisan)}
                    className="glass rounded-xl px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/[0.08] transition-all"
                  >
                    Yetki Düzenle
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {seciliCalisan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden" style={{ background: '#111' }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
              <div>
                <h2 className="text-lg font-bold text-white">{seciliCalisan.full_name}</h2>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {ROL_LABEL[seciliCalisan.role ?? ''] ?? seciliCalisan.role} · {aktifSayisi}/{toplamSayisi} yetki aktif
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={varsayilanaDonus} className="text-xs text-[#94A3B8] hover:text-white px-3 py-1.5 glass rounded-lg transition-colors">
                  Varsayılan
                </button>
                <button onClick={tumunuAc} className="text-xs text-[#94A3B8] hover:text-white px-3 py-1.5 glass rounded-lg transition-colors">
                  Tümünü Aç
                </button>
                <button onClick={tumunuKapat} className="text-xs text-[#94A3B8] hover:text-white px-3 py-1.5 glass rounded-lg transition-colors">
                  Tümünü Kapat
                </button>
                <button onClick={kapat} className="text-white/40 hover:text-white ml-2 text-xl leading-none">×</button>
              </div>
            </div>

            {/* Yetki listesi */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
              {yukleniyor ? (
                <div className="py-16 text-center text-[#94A3B8] text-sm">Yükleniyor...</div>
              ) : permissions ? (
                YETKI_GRUPLARI.map(grup => (
                  <div key={grup.baslik}>
                    <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">{grup.baslik}</p>
                    <div className="space-y-1">
                      {grup.yetkiler.map(yetki => (
                        <div
                          key={yetki.key}
                          onClick={() => toggle(yetki.key)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all ${
                            permissions[yetki.key]
                              ? 'bg-orange-500/10 border border-orange-500/20'
                              : 'bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06]'
                          }`}
                        >
                          <div>
                            <p className={`text-sm font-medium ${permissions[yetki.key] ? 'text-white' : 'text-white/60'}`}>
                              {yetki.label}
                            </p>
                            <p className="text-xs text-[#94A3B8] mt-0.5">{yetki.aciklama}</p>
                          </div>
                          <div className={`w-11 h-6 rounded-full relative flex-shrink-0 ml-4 transition-colors ${
                            permissions[yetki.key] ? 'bg-orange-500' : 'bg-white/10'
                          }`}>
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                              permissions[yetki.key] ? 'left-[22px]' : 'left-0.5'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-between">
              <button onClick={kapat} className="text-sm text-[#94A3B8] hover:text-white transition-colors">
                İptal
              </button>
              <button
                onClick={kaydet}
                disabled={kaydediyor}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  basarili
                    ? 'bg-green-500 text-white'
                    : 'bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)]'
                }`}
              >
                {basarili ? '✓ Kaydedildi' : kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
