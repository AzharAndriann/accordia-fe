# Accordia — Dokumentasi Frontend Mobile

Status: spesifikasi MVP dan panduan bootstrap, bukan aplikasi yang sudah diimplementasikan.

## 1. Konsep dan ruang lingkup
Accordia membantu freelancer dan klien mencatat ruang lingkup proyek, biaya, tenggat, batas revisi, perubahan pekerjaan, dan penyerahan hasil. Freelancer mengundang kliennya sendiri; MVP bukan marketplace. Pembayaran dicatat melalui bukti transfer, tanpa penitipan uang atau payment gateway. Persetujuan di aplikasi merupakan catatan persetujuan; tidak dipasarkan sebagai tanda tangan elektronik tersertifikasi atau jaminan penyelesaian sengketa.

## 2. Stack
- React Native, Expo, TypeScript, Expo Router.
- NativeWind: gunakan satu versi mayor beserta panduan yang sesuai, jangan campur konfigurasi v4 dan v5.
- TanStack Query untuk server state.
- React Hook Form, Zod, dan resolver untuk formulir.
- Expo SecureStore untuk refresh token; access token disimpan dalam memori.
- Expo DocumentPicker untuk lampiran; Expo Linking/Router untuk undangan.
- Backend terpisah: Bun + Express + Prisma 7 + PostgreSQL, tanpa Supabase.

## 3. Peran dan hak akses
Satu akun bisa menjadi freelancer pada proyek A dan klien pada proyek B. Peran melekat pada keanggotaan proyek, bukan pilihan saat login. Frontend menyesuaikan tombol, tetapi API wajib tetap memeriksa izin.

| Aktivitas | Freelancer | Klien |
| --- | --- | --- |
| Membuat proyek dan undangan | Ya | Tidak pada MVP |
| Menyusun draft kesepakatan | Ya | Melihat versi yang diajukan |
| Menyetujui versi | Versi sendiri harus dikonfirmasi | Ya |
| Mengusulkan perubahan | Ya | Membuat permintaan kepada freelancer |
| Mengirim hasil pekerjaan | Ya | Tidak |
| Meminta revisi / menerima hasil | Tidak | Ya |
| Melihat riwayat proyek | Ya | Ya |

## 4. Fitur dan layar
### Autentikasi
Register, login, pemulihan password, logout. Restore sesi memakai refresh token. Saat sesi tidak valid, hapus cache privat dan arahkan ke login. Jangan mencatat token/password pada log.

### Dashboard dan daftar proyek
Tampilkan proyek aktif, menunggu persetujuan, perlu revisi, dan selesai. Filter berdasarkan status. Daftar memakai pagination. Proyek tidak muncul bagi pengguna di luar anggota proyek.

### Detail proyek
Ringkasan klien/freelancer, ruang lingkup, total biaya, deadline, tahap pekerjaan, dan versi kesepakatan aktif. Tab: Ringkasan, Kesepakatan, Penyerahan, Pembayaran, Riwayat.

### Undangan klien
Freelancer membuat tautan undangan melalui API. Tautan berisi token sekali pakai dengan masa berlaku. Klien login/register lalu menerima undangan. Tampilkan kondisi expired, sudah digunakan, dan email tidak sesuai. Jangan otomatis menggabungkan akun hanya berdasarkan email yang diketik.

### Kesepakatan dan persetujuan
Form mencakup judul, deskripsi pekerjaan, deliverable, biaya IDR, tenggat, jumlah putaran revisi, aturan pembatalan, dan ketentuan hak penggunaan karya. Tampilkan versi serta rincian lengkap sebelum tombol Setujui. Persetujuan menyebut version ID; jangan mengirim persetujuan terhadap 'versi terbaru' tanpa ID. Versi aktif hanya berubah setelah kedua pihak menyetujui. Versi yang sudah diajukan tidak bisa diedit; perubahan menjadi versi baru.

### Permintaan perubahan
Klien menjelaskan tambahan pekerjaan. Freelancer membuat usulan versi lengkap yang mencakup tambahan biaya dan tenggat. UI menampilkan perbandingan versi aktif dengan versi usulan. Penolakan mempertahankan versi aktif sebelumnya. MVP mengizinkan satu usulan pending per proyek.

### Penyerahan dan revisi
Freelancer mengirim catatan dan file/tautan hasil. Klien menerima atau meminta revisi disertai alasan. Tampilkan putaran revisi yang terpakai dan batas dari kesepakatan aktif. Revisi di luar batas diarahkan ke perubahan pekerjaan. MVP satu penyerahan aktif per proyek, tanpa milestone kompleks.

### Catatan pembayaran
Klien mengunggah bukti transfer dan nominal; freelancer mengonfirmasi atau menolak dengan alasan. Bedakan 'bukti dikirim' dan 'pembayaran dikonfirmasi'. Pembayaran parsial didukung sebagai beberapa catatan. Jangan menyamakan upload bukti dengan pembayaran terverifikasi bank.

### Riwayat dan ekspor
Timeline berisi aktor, waktu server, versi kesepakatan, keputusan, dan konfirmasi pembayaran. Pengguna dapat mengunduh laporan melalui endpoint privat. Notifikasi MVP berupa daftar in-app yang di-refresh; push notification tahap berikutnya.

## 5. Setup awal
### Prasyarat
Node.js LTS yang didukung Expo SDK pilihan, npm, Git, perangkat/emulator. Versi Expo/React Native harus mengikuti template dan pemeriksaan Expo, bukan dipilih terpisah. Simpan package-lock.json.

```bash

npx create-expo-app@latest accordia-mobile
cd accordia-mobile
npm install @tanstack/react-query react-hook-form zod @hookform/resolvers
npx expo install expo-secure-store expo-document-picker expo-file-system expo-sharing
npx expo-doctor
```

Template default menyediakan Expo Router. Ikuti struktur `app/` atau `src/app/` yang dibuat template; contoh berikut menggunakan `src/app/`.

### NativeWind
Ikuti panduan resmi versi yang dipilih. Untuk jalur v4, paket dan konfigurasi memakai Tailwind 3; jalur v5 memakai Tailwind 4 dan konfigurasi berbeda. Jangan langsung memasukkan konfigurasi v4 ke SDK terbaru tanpa mengecek kompatibilitas. Bootstrap dan koneksi API dapat dijalankan lebih dahulu dengan StyleSheet, kemudian NativeWind ditambahkan setelah smoke test. Catat versi yang berhasil di README proyek.

Panduan: https://www.nativewind.dev/docs/getting-started/installation

### Environment
Buat `.env`:
```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000/api/v1
```
Ganti IP dengan IP LAN komputer backend. Android emulator biasanya memakai `10.0.2.2`; iOS simulator pada Mac dapat memakai localhost. Ponsel fisik memerlukan jaringan yang sama dan firewall yang mengizinkan koneksi. Variabel EXPO_PUBLIC bersifat publik: jangan simpan DATABASE_URL, JWT secret, atau password di sini. Untuk produksi gunakan HTTPS.

### Struktur direktori
```text
src/
  app/
    _layout.tsx
    (auth)/login.tsx
    (auth)/register.tsx
    (app)/index.tsx
    (app)/projects/index.tsx
    (app)/projects/[id]/index.tsx
    (app)/projects/[id]/agreement.tsx
    (app)/projects/[id]/changes.tsx
    (app)/projects/[id]/deliveries.tsx
    (app)/projects/[id]/payments.tsx
    invitations/[token].tsx
  components/
  features/auth/
  features/projects/
  features/agreements/
  features/deliveries/
  features/payments/
  lib/api.ts
  lib/query-client.ts
  lib/session.ts
  types/api.ts
```

### Query provider
Di `src/app/_layout.tsx`, setelah menyesuaikan layout bawaan:
```tsx
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack />
    </QueryClientProvider>
  );
}
```
Tambahkan session provider dan protected routes saat fitur auth diimplementasikan. Layout di atas baru menyediakan cache, belum proteksi autentikasi.

### Smoke test API
`src/lib/api.ts`:
```ts
const baseUrl = process.env.EXPO_PUBLIC_API_URL;

export async function checkHealth() {
  if (!baseUrl) throw new Error('EXPO_PUBLIC_API_URL belum diisi');
  const response = await fetch(`${baseUrl}/health`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}
```
Panggil dari layar pengujian, lalu jalankan:
```bash
npx expo start
```
Jika memilih development build, install build tersebut pada perangkat lebih dahulu, kemudian gunakan `npx expo start --dev-client`. Expo Go hanya digunakan jika seluruh modul dan SDK kompatibel.

## 6. Kontrak integrasi
Prefix `/api/v1`; JSON UTF-8; tanggal timestamp ISO 8601 UTC, deadline tanggal `YYYY-MM-DD`. Nominal dikirim string angka rupiah penuh, misalnya `"3000000"`, dan diformat dengan Intl.NumberFormat pada UI. Jangan mengirim teks `Rp3.000.000` sebagai nilai API.

- Auth: POST /auth/register, /login, /refresh, /logout.
- Proyek: GET/POST /projects, GET /projects/:id.
- Undangan: POST /projects/:id/invitations; POST /invitations/accept.
- Versi: GET/POST /projects/:id/agreement-versions; POST /agreement-versions/:id/submit; POST /agreement-versions/:id/approve atau /reject.
- Perubahan: GET/POST /projects/:id/change-requests.
- Penyerahan: GET/POST /projects/:id/deliveries; POST /deliveries/:id/accept atau /request-revision.
- Pembayaran: GET/POST /projects/:id/payments; POST /payments/:id/confirm atau /reject.
- File: POST /projects/:id/files; GET /files/:id/download.
- Riwayat/ekspor: GET /projects/:id/events dan /export.

Swagger UI: `/api-docs/`; spesifikasi OpenAPI: `/openapi.json` pada host backend, di luar prefix `/api/v1`. Runtime backend tetap Bun.

Endpoint fitur adalah kontrak yang direncanakan, belum tersedia hanya dengan bootstrap backend. Detail payload dan aturan ada di dokumentasi backend.

Error: `{ "error": { "code": "VERSION_CONFLICT", "message": "Versi sudah berubah" } }`. Tangani 401 dengan satu refresh terkoordinasi dan maksimal satu retry; 403 tanpa retry; 409 dengan refetch dan penjelasan; 422 dengan pesan validasi. Matikan retry otomatis pada mutasi persetujuan/pembayaran dan gunakan Idempotency-Key per aksi logis.

## 7. Validasi dan pengalaman pengguna
- Form biaya positif, durasi tenggat valid, deskripsi dan deliverable wajib.
- Tombol submit disabled saat pending; konfirmasi sebelum persetujuan.
- Loading, empty state, offline state, error dan retry wajib tersedia.
- Jangan menampilkan aksi sukses sebelum respons server mengonfirmasi.
- File upload menampilkan progres/kegagalan; batas MVP 10 MiB per file, PDF/JPEG/PNG, maksimal 5 file per pengiriman.
- Cache query diawali user ID dan project ID; bersihkan saat logout/berganti akun.
- Tampilkan waktu zona lokal, tetapi simpan/urutkan berdasarkan waktu server.

## 8. Urutan implementasi dan penerimaan
1. Bootstrap, health check dari ponsel.
2. Register/login/refresh/logout dan route protection.
3. Buat proyek, undang akun kedua, daftar proyek sesuai anggota.
4. Draft, submit, dan persetujuan dua pihak.
5. Perubahan versi, penyerahan, dan revisi.
6. Pembayaran, timeline, ekspor.

Uji dengan akun freelancer A, klien B, dan akun asing C. C tidak boleh membaca proyek/file A-B. Persetujuan versi lama harus menampilkan konflik. Klik ganda tidak membuat dua persetujuan/pembayaran. Logout tidak meninggalkan data proyek di layar. Uji satu alur lengkap di Android/iOS target.

## 9. Referensi
- https://docs.expo.dev/more/create-expo/
- https://docs.expo.dev/router/introduction/
- https://docs.expo.dev/versions/latest/sdk/securestore/
- https://docs.expo.dev/versions/latest/sdk/document-picker/
- https://www.nativewind.dev/docs/getting-started/installation
- https://tanstack.com/query/latest/docs/framework/react/react-native

Dokumentasi ini adalah rencana implementasi. Perintah bootstrap belum dieksekusi dan kompatibilitas seluruh paket belum diuji dalam proyek Accordia.
