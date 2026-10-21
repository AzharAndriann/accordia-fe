# Accordia Mobile

Frontend mobile Accordia menggunakan Expo SDK 58, React Native, TypeScript,
Expo Router, TanStack Query, React Hook Form, dan Zod. Package manager project
ini adalah **Bun**.

## Menjalankan project

```bash
cp .env.example .env
bun install
bun run doctor
bun run typecheck
bun run ios
```

`bun run ios` membuat dan memasang development build ke iOS Simulator. Setelah
development build sudah terpasang, penggunaan sehari-hari cukup jalankan:

```bash
bun run start
```

Lalu tekan `i` pada terminal Expo untuk membuka aplikasi di iOS Simulator.

Perintah target yang tersedia:

```bash
bun run android
bun run ios
bun run web
```

Atur `EXPO_PUBLIC_API_URL` sesuai perangkat:

- iOS Simulator: `http://127.0.0.1:3000/api/v1`
- Android Emulator: `http://10.0.2.2:3000/api/v1`
- Perangkat fisik: gunakan IP LAN komputer backend, misalnya
  `http://192.168.1.10:3000/api/v1`

Variabel `EXPO_PUBLIC_*` dapat dilihat pengguna aplikasi. Jangan menyimpan JWT
secret, database URL, password, atau rahasia lain di dalamnya.

## Fondasi yang tersedia

- Routing awal di `src/app/` untuk auth, proyek, agreement, change request,
  delivery, payment, dan undangan.
- TanStack Query provider dengan retry mutation dimatikan.
- API client dan health check backend.
- Access token hanya berada di memori.
- Refresh token menggunakan Expo SecureStore pada Android/iOS.
- TypeScript path alias `@/` dan tipe respons API dasar.

NativeWind belum dipasang. Sesuai dokumen arsitektur, styling awal memakai
`StyleSheet`; NativeWind dipilih setelah smoke test native agar konfigurasi
major version-nya tidak tercampur.
