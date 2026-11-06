export type Permissions = {
  isci_goruntule: boolean
  isci_duzenle: boolean
  isci_sil: boolean
  santiye_goruntule: boolean
  santiye_duzenle: boolean
  santiye_sil: boolean
  puantaj_goruntule: boolean
  puantaj_gir: boolean
  qr_tara: boolean
  avans_goruntule: boolean
  avans_yonet: boolean
  belge_goruntule: boolean
  belge_yonet: boolean
  sgk_goruntule: boolean
  harcama_goruntule: boolean
  harcama_ekle: boolean
  bordro_goruntule: boolean
  rapor_goruntule: boolean
  davet_olustur: boolean
}

export const VARSAYILAN_FOREMAN: Permissions = {
  isci_goruntule: true,
  isci_duzenle: false,
  isci_sil: false,
  santiye_goruntule: true,
  santiye_duzenle: false,
  santiye_sil: false,
  puantaj_goruntule: true,
  puantaj_gir: true,
  qr_tara: true,
  avans_goruntule: true,
  avans_yonet: false,
  belge_goruntule: true,
  belge_yonet: false,
  sgk_goruntule: false,
  harcama_goruntule: true,
  harcama_ekle: true,
  bordro_goruntule: false,
  rapor_goruntule: true,
  davet_olustur: false,
}

export const VARSAYILAN_WORKER: Permissions = {
  isci_goruntule: false,
  isci_duzenle: false,
  isci_sil: false,
  santiye_goruntule: true,
  santiye_duzenle: false,
  santiye_sil: false,
  puantaj_goruntule: true,
  puantaj_gir: false,
  qr_tara: true,
  avans_goruntule: true,
  avans_yonet: false,
  belge_goruntule: true,
  belge_yonet: false,
  sgk_goruntule: false,
  harcama_goruntule: false,
  harcama_ekle: false,
  bordro_goruntule: false,
  rapor_goruntule: false,
  davet_olustur: false,
}
