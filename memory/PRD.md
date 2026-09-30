# PRD — BicaraPro

## Session Log
- **2026-09-30**: Environment recovery + object-storage migration. Restored missing `backend/.env` & `frontend/.env`; installed backend pip deps (librosa etc.) and frontend `node_modules`; fixed missing `LlmChat`/`UserMessage` imports (crash-loop); **migrated audio uploads from pod-local `uploads/` to Emergent object storage** (`bicarapro/uploads/<user_id>/<file>`, streamed via `GET /api/analyses/{id}/audio` with legacy local fallback); pinned Expo Metro to port 3000 (`expo start --port 3000`). Tested: 37/37 backend pytest + full frontend flows green (iteration_6).
- **Backlog**: P1 record-flow UI test on a real device/mic; P2 backfill legacy local audio files into object storage; P2 expose `audio_storage_path` in AnalysisDetail if needed; P3 ffmpeg setup-error gating in test_audio_formats.py.

**Implementasi Algoritma MFCC untuk Analisis Intonasi & Kejelasan Suara Public Speaking**
_(SMK Swasta Binaguna Tanah Jawa)_

## Overview
BicaraPro adalah aplikasi mobile Expo yang membantu siswa SMK berlatih public speaking dengan analisis ilmiah menggunakan algoritma **Mel-Frequency Cepstral Coefficients (MFCC)**. Backend menggunakan `librosa` untuk ekstraksi fitur audio; frontend melakukan perekaman via `expo-audio` dan mengunggah ke backend.

## Roles
- **Siswa** — rekam latihan, dapat hasil MFCC + skor intonasi & kejelasan, transkrip Whisper, dan feedback naratif Claude Haiku 4.5. Lihat riwayat & materi.
- **Guru** — dashboard kelas, daftar siswa, detail riwayat per siswa.

## Key Features
1. Auth JWT (register/login) dengan role Siswa & Guru
2. Perekaman audio via mikrofon (expo-audio) + upload
3. Analisis MFCC di backend (librosa):
   - 13 koefisien MFCC (mean & std)
   - Pitch (pyin) → intonasi
   - RMS, zero crossing rate, spectral centroid, spectral flatness → kejelasan
   - Skor Intonasi (0–100) & Kejelasan (0–100), overall = avg
4. Transkripsi Whisper-1 → subtitle
5. Feedback naratif AI (Claude Haiku 4.5) via Emergent LLM key
6. Riwayat rekaman per siswa
7. Dashboard guru dengan statistik kelas + drill-down per siswa
8. Materi/tips public speaking (6 modul terseed)

## Backend
- FastAPI + Motor (async MongoDB) + librosa + soundfile + openai (Whisper) + emergentintegrations (Claude)
- All routes prefixed `/api`
- Bcrypt password hashing, JWT (HS256) 24-jam TTL

## Frontend
- Expo Router (typedRoutes)
- Route groups: `(siswa)` (home / history / materials / profile), `(guru)` (dashboard / materials / profile)
- Global: `onboarding`, `login`, `register`, `record`, `result/[id]`, `student/[id]`
- `AuthProvider` + `SafeAreaProvider` + `KeyboardProvider` + `GestureHandlerRootView` di root layout

## Integrations
- **Whisper-1** (STT) — via OpenAI SDK dengan `EMERGENT_LLM_KEY` → base_url `https://integrations.emergentagent.com/llm`
- **Claude Haiku 4.5** — via `emergentintegrations.LlmChat` (anthropic/`claude-haiku-4-5-20251001`)

## Demo Credentials
- Guru: `guru@smkbinaguna.sch.id` / `guru123`
- Siswa: `siswa@smkbinaguna.sch.id` / `siswa123`
