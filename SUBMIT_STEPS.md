# STARSLING — Langkah Submit (untuk adt)

**Kontes:** The $65K Web Game Contest (Base44 x Nitro by Overwolf)
**Deadline:** 3 Des 2026 23:59 UTC = **4 Des 2026 06:59 WIB** — target submit **2 Des**.
**Yang sudah jadi:** game referensi lengkap + 41/41 test lolos + demo live
+ 4 prompt Base44 siap tempel. **Yang belum:** build di dalam Base44 +
> submit form — keduanya butuh akun + browser kamu, tidak bisa dari VM.

## Ringkasan: yang kamu perlukan

| # | Kebutuhan | Kapan | Estimasi |
|---|---|---|---|
| 1 | Akun gratis Base44 (base44.com) — daftar pakai emailmu | 19 Nov | 5 mnt |
| 2 | Tempel Prompt P1–P4 berurutan di Base44 (file `BASE44_PROMPTS.md`) | 19 Nov | ±60–90 mnt total (mayoritas menunggu build) |
| 3 | Playtest + prompt perbaikan bila ada bug (P5/template F1–F5) | 20–21 Nov | ±30–60 mnt |
| 4 | Publish ke base44.app + list di Launchpad | 21 Nov | 10 mnt |
| 5 | Rekam video demo <3 mnt (opsional tapi disarankan; naskah di `VIDEO_SCRIPT.md`) | 21–30 Nov | ±30–45 mnt |
| 6 | Isi form submission di nitropay.com/base44webgame (draf di `SUBMISSION.md`) | 2 Des | 10–15 mnt |
| 7 | (Bila menang) bukti identitas + dokumen pajak/W-8BEN — sudah kamu izinkan 19 Nov | Setelah 10 Des | — |

Total kerja kamu: **±2,5–3,5 jam tersebar 19 Nov–2 Des**, tanpa biaya apa pun.

## Langkah 1 — Buat akun gratis Base44 (19 Nov, 5 mnt)

1. Buka https://base44.com, klik Sign up.
2. Daftar pakai emailmu sendiri (akun harus atas namamu — T&C §4.1(b)).
   Paket gratis sudah cukup; **jangan upgrade** (tidak diperlukan, T&C §4.2b
   di T&C kontes: "A free Base44 account is sufficient").
3. Verifikasi: di dashboard, cek kredit — seharusnya **25 message credit,
   maks 5/hari**. Kalau angkanya berbeda, beri tahu koordinator sebelum
   lanjut (rencana prompt dihitung dari angka ini).

## Langkah 2 — Build game via prompt (19 Nov, 4 prompt)

1. Di Base44, buat **aplikasi baru** (satu proyek; beri nama `STARSLING`).
2. Buka file `BASE44_PROMPTS.md`, salin **P1** utuh, tempel ke builder
   Base44, kirim. Tunggu build selesai.
3. Jalankan checklist **Verify P1** (di bawah prompt). Kalau ada yang
   gagal, JANGAN lanjut — pakai template perbaikan §5 dulu.
4. Ulangi untuk **P2, P3, P4** berurutan, masing-masing + checklist-nya.
   Jangan kirim 2 prompt sekaligus; Base44 membangun satu per satu.
5. Budget: 4 prompt ≈ 6 kredit dari 25. Jangan habiskan kredit untuk
   polish spekulatif — hanya perbaiki bug nyata.

## Langkah 3 — Playtest + perbaikan (20–21 Nov)

1. Mainkan game Base44-mu dari Level 1 s.d. 12 (desktop + HP).
   Bandingkan dengan demo referensi (URL di `README.md`) bila ragu soal
   "seharusnya seperti apa".
2. Kalau ada bug, kirim SATU prompt perbaikan per bug dari template
   F1–F5 di `BASE44_PROMPTS.md` §5 (jelaskan gejala persisnya).
3. Checklist playtest: semua 12 level bisa dimenangkan; preview lintasan
   sesuai dengan penerbangan nyata; skor/kombo/orbit bonus jalan;
   progress tersimpan setelah refresh; tidak ada login/paywall; HP bisa
   drag dengan touch.

## Langkah 4 — Publish + Launchpad (21 Nov, 10 mnt)

1. Di Base44, klik **Publish**, pastikan aplikasi **Public**. Salin URL
   `*.base44.app` — INI URL submission.
2. Buka URL itu di incognito (tanpa login): harus langsung bisa dimainkan.
3. List aplikasi di **Base44 Launchpad** agar bisa dikumpulkan upvote
   komunitas (jalur Community Vote: 25 teratas masuk shortlist).
   **JANGAN** beli vote / pakai bot / script — T&C §8.4 mendiskualifikasi
   manipulasi vote. Bagikan link ke teman secara organik saja.
4. Catat URL Base44-mu ke `SUBMISSION.md` (ganti TODO).

## Langkah 5 — Video demo (21–30 Nov, opsional tapi disarankan)

1. Ikuti `VIDEO_SCRIPT.md` (rekam layar <3 mnt, tanpa wajah, suara game).
2. Rekam dari **URL Base44** (bukan demo referensi).
3. Upload ke YouTube (Public/Unlisted) bila perlu link.

## Langkah 6 — Submit form (target 2 Des, tenggat 3 Des 23:59 UTC)

1. Buka https://nitropay.com/base44webgame/, klik **Submit Your Game**.
2. Isi form dengan draf di `SUBMISSION.md` (judul STARSLING, URL Base44,
   deskripsi). Form meminta (per T&C §5.1(c)): nama lengkap, email valid,
   akun Base44, judul game, URL, deskripsi.
3. ⚠️ **Perlu dicek kamu di browser** (tidak bisa diverifikasi dari VM):
   field persis form, apakah video wajib/opsional, dan apakah ada
   konfirmasi email setelah submit. Kalau form meminta sesuatu yang tidak
   ada di draf, berhenti dan tanyakan ke koordinator — jangan mengarang.
4. Simpan bukti submit (screenshot halaman konfirmasi / email).
5. Setelah submit: **jangan ubah game secara material** dan biarkan tetap
   live s.d. akhir judging + 90 hari setelah pengumuman (T&C §6.1(e)).

## Setelah submit

- **4–9 Des:** judging. **~10 Des:** pengumuman pemenang.
- Bila menang: Overwolf menghubungimu via email ≤7 hari setelah judging;
  balas ≤14 hari + siapkan bukti identitas + dokumen pajak (W-8BEN untuk
  non-AS) + detail pembayaran. Hadiah dibayar via transfer bank USD dalam
  60 hari setelah verifikasi (T&C §9.2, §9.4, §10.1).
- Game tetap live 90 hari setelah pengumuman.

## Yang TIDAK boleh dilakukan

- Jangan membuat akun Base44 kedua / submit game kedua (satu game per akun,
  T&C §5.2).
- Jangan menempel kode referensi ke Base44 — build harus lewat prompt agar
  riwayat proyek Base44 membuktikan build selama periode submission
  (T&C §6.2).
- Jangan pakai materi berhak cipta (karakter/musik/asset game lain).
- Jangan beli/manipulasi vote.
- Jangan mengubah game secara material setelah submit s.d. pengumuman.
