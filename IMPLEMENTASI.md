# Implementasi fitur dan perbaikan Accordia — 2 November 2026

Perubahan diterapkan pada frontend `accordia-fe` dan backend `accordia-be`. Lima fitur yang dikecualikan pengguna tidak dikerjakan: lupa password, ekspor riwayat, permintaan penghapusan data, gateway pembayaran, dan tanda tangan elektronik.

## Yang sudah dibuat

- Push perangkat: registrasi/nonaktif token Expo dari layar Akun → Pengaturan notifikasi, pembaruan proyek dari audit event, undangan, navigasi saat notifikasi diketuk, antrean persisten, retry, pemeriksaan receipt dan penonaktifan token invalid. Sesi aktif/keanggotaan diperiksa kembali sebelum mengirim. Token perangkat dipindahkan ketika refresh token berotasi dan dinonaktifkan saat logout.
- Email undangan: antrean Resend dibuat dalam transaksi bersama undangan. Email memuat deep link `accordia://invitations/{id}`; penerima harus login dengan email tujuan. Tidak ada pengiriman email nyata selama implementasi/tes.
- Deep link undangan: halaman pratinjau privat, login/registrasi dengan tujuan undangan dipertahankan, persetujuan eksplisit menerima, penanganan email salah/expired/used/cancelled. Tombol berbagi tautan tersedia pada undangan pending.
- Progres upload persentase pada penyerahan dan pembayaran melalui XMLHttpRequest. Angka 100 ditampilkan setelah server menerima file; penyimpanan delivery/payment tetap ditunggu. Batal formulir dinonaktifkan selama proses.
- Logout server: mencabut keluarga sesi refresh perangkat dan menonaktifkan push, lalu menghapus sesi/cache lokal. Jika server tidak terjangkau, tampilkan kegagalan untuk dicoba ulang; tidak mengklaim sesi telah dicabut.
- Pembatalan proyek: draft tanpa klien dapat dibatalkan freelancer; proyek dengan dua anggota membutuhkan keputusan pihak lain. Alasan/keputusan masuk aktivitas. Pembatalan tidak mengembalikan dana otomatis. Proyek COMPLETED tidak dapat dibatalkan melalui alur ini.
- Sengketa internal: anggota mencatat masalah, mengusulkan solusi, lalu pihak lain menyetujui/menolak. Keputusan harus menyebut updatedAt yang ditinjau; usulan kedaluwarsa ditolak. Ini pencatatan solusi bersama, bukan mediasi/arbitrase eksternal atau penandatanganan tersertifikasi.
- Persetujuan kebijakan: layar syarat/privasi dari API, checkbox terpisah, tanggal lahir dan pernyataan kecakapan, versi serta waktu persetujuan disimpan. Minimum usia 18 adalah aturan produk pada versi ini; validasi berdasarkan tanggal yang dinyatakan pengguna, bukan verifikasi identitas resmi. Akun lama diminta melengkapi persetujuan; backend menolak resource proyek sebelum persetujuan versi aktif tersedia.

Dokumen kebijakan di `accordia-be/src/modules/auth/policies.ts` adalah naskah awal produk. Kontak pengelola, retensi dan rincian deployment perlu dilengkapi pemilik sebelum publikasi umum; tidak ada klaim kepatuhan hukum otomatis.

## Bug yang diperbaiki

1. Schema gabungan parameter projectId/invitationId untuk pembatalan undangan dan permintaan pelepasan klien.
2. Penerimaan delivery menghitung pelunasan: proyek menjadi COMPLETED jika pembayaran sudah lunas; jika belum, DELIVERED.
3. Audit event untuk batal undangan dan permintaan/keputusan pelepasan klien. Keputusan pelepasan menggunakan conditional update agar respons yang sudah diproses tidak tertimpa.
4. File tepat 10 MiB diterima, sedangkan lebih besar tetap ditolak.
5. Cache query dibersihkan saat identitas berubah/sesi berakhir otomatis. Generasi sesi mencegah refresh/request akun lama menghidupkan kembali sesi atau memakai akun baru. Penulisan SecureStore diserialkan agar logout tidak meninggalkan token akibat race.
6. Format rupiah pada kesepakatan/perubahan memakai BigInt. Tombol kirim hasil hanya ditawarkan pada ACTIVE; server menolak keputusan penyerahan/pembayaran setelah pembatalan. Tautan hasil dibatasi HTTP(S).

## Aktivasi yang masih memerlukan lingkungan pemilik

Migrasi database **belum dijalankan** dan pengiriman push/email nyata **belum diuji**. Implementasi source sudah tersedia; fitur yang memakai model baru membutuhkan migrasi sebelum aplikasi digunakan.

### Database

Dua migrasi baru tersedia di backend:

- `20261102160000_project_completion`: tambahan tipe audit event.
- `20261102161000_collaboration_features`: UserConsent, PushDevice, NotificationJob, ProjectRequest beserta indeks.

Pemilik menjalankan `bun run db:deploy` pada backend setelah menentukan database tujuan dan prosedur backup yang sesuai, kemudian `bun run db:generate` bila diperlukan. Tidak ada database pengguna yang diubah selama pengerjaan ini.

### Push notification

1. Hubungkan aplikasi ke proyek Expo/EAS milik pengelola dan isi `expo.extra.eas.projectId` dengan UUID proyek yang sebenarnya; tidak ada UUID contoh yang dipasang.
2. Konfigurasikan kredensial APNs/FCM untuk build target dan rebuild aplikasi setelah penambahan plugin `expo-notifications`. Development build lama perlu dibangun ulang.
3. Backend menerima konfigurasi runtime `NOTIFICATIONS_ENABLED=true`; `EXPO_ACCESS_TOKEN` opsional jika keamanan Expo Push diaktifkan. Tidak ada file env yang diedit untuk mengisi kredensial.
4. Pada perangkat fisik, buka Akun → Pengaturan notifikasi → Aktifkan. Uji undangan dan pembaruan proyek dengan akun kedua, lalu ketuk notifikasi.

Antrean memakai pengiriman setidaknya sekali; gangguan proses setelah provider menerima dapat menyebabkan duplikasi push. Job retry dibatasi lima percobaan. Receipt Expo diperiksa sekitar 15 menit setelah ticket diterima. Job gagal ditandai FAILED; pemantauan operasional/retry manual belum memiliki dashboard admin.

### Email

1. Siapkan domain pengirim terverifikasi di Resend.
2. Sediakan `RESEND_API_KEY` dan `NOTIFICATION_EMAIL_FROM` pada runtime backend, serta `NOTIFICATIONS_ENABLED=true`. Worker membaca konfigurasi runtime; tidak membutuhkan perubahan modul env yang ada.
3. Tanpa konfigurasi email, job email tetap mengantre; undangan in-app dan berbagi tautan tetap dapat digunakan setelah migrasi.
4. Buat undangan menggunakan alamat uji yang dikuasai pengelola. Periksa penerimaan email dan tautan pada perangkat dengan Accordia terpasang. Native custom scheme membutuhkan aplikasi terpasang; landing page pemasangan dan universal/app links HTTPS tidak dibuat.

API memakai header Idempotency-Key per job untuk Resend. Worker tidak mencatat API key/token atau isi respons provider ke log.

Referensi integrasi: [Expo setup](https://docs.expo.dev/push-notifications/push-notifications-setup/), [Expo send/receipt](https://docs.expo.dev/push-notifications/sending-notifications/), [Resend send email](https://resend.com/docs/api-reference/emails/send-email).

## Validasi

- Typecheck frontend dan backend lulus.
- ESLint frontend lulus.
- Backend asli: 42 tes tanpa memuat modul konfigurasi env lulus.
- Frontend: 11 tes regresi backend dan 3 tes sesi/cache lulus.
- Salinan backend terisolasi dengan konfigurasi sintetis: keseluruhan 68 tes lulus, mencakup auth, OpenAPI, request proyek, provider notification mock dan regresi. Konfigurasi sintetis tidak disalin ke repo asli.
- Tes provider memakai fetch mock, bukan pengiriman email/push nyata. Parser file memakai stream dan filesystem sementara nyata. Tidak ada pengujian layar/perangkat atau transaksi database nyata pada tahap ini.

Catatan batas env: nilai file env tidak diperiksa atau ditampilkan dan file tidak diedit. Perintah awal pemasangan dependency melalui Expo memanggil Bun anak yang melaporkan pemuatan `.env` otomatis; peristiwa ini sudah disampaikan kepada pengguna. Pemeriksaan source dan tes berikutnya memakai jalur tanpa pemuatan file tersebut.

## Skenario penerimaan setelah aktivasi

1. Migrasikan backend, rebuild aplikasi dan login akun lama: pastikan persetujuan diminta dan tersimpan setelah restart.
2. Registrasi di bawah 18 tahun, checkbox belum lengkap dan versi kebijakan lama harus ditolak.
3. Undang email akun klien, terima melalui tautan setelah login/registrasi; ulangi dengan email salah, expired, used dan cancelled.
4. Uji push, token invalid, perangkat logout, serta anggota yang sudah dilepas; pastikan konten proyek tidak ditaruh pada body notifikasi.
5. Unggah tepat 10 MiB, >10 MiB, 5/6 file dan file palsu. Periksa progres serta galat koneksi.
6. Uji pembayaran lunas sebelum hasil diterima dan urutan sebaliknya; keduanya harus berakhir COMPLETED.
7. Batalkan undangan dan lakukan pelepasan klien; pastikan event baru muncul di aktivitas.
8. Uji pembatalan draft sendiri, persetujuan/penolakan pembatalan oleh pihak lain, serta penolakan perubahan pekerjaan setelah CANCELLED.
9. Uji sengketa: buat → solusi → ubah solusi → tolak persetujuan versi lama → setujui versi terbaru dari pihak lain. Uji outsider dan klik ganda.
10. Logout, login akun lain dan uji refresh yang sedang berjalan: cache/sesi lama tidak boleh muncul kembali.
