# EVRIS — Event Visual Information Retrieval System

EVRIS is an AI-powered event photography platform that transforms photo discovery from manual gallery browsing into an instant, AI-driven selfie-to-photo search experience. Event organizers can upload and manage large event photo galleries, while attendees can instantly find their own photos using facial recognition.

---

## 🌟 Key Features

* **Selfie-to-Photo Discovery**: Attendees upload a selfie to automatically find all event photographs in which they appear.
* **Multi-Face Recognition**: Automatically detects and extracts 512-dimensional facial embeddings for **every** face present in group or crowd photos.
* **Sub-Second Vector Search**: Leverages Supabase and `pgvector` for lightning-fast cosine similarity vector searching.
* **Event-Specific Partitioning**: Enforces strict event ID filtering so searches remain isolated to the selected event gallery.
* **Resource-Optimized AI Pipeline**: Built using InsightFace (`Buffalo_SC`) and `ONNX Runtime CPU` to run smoothly and reliably on constrained cloud tiers.

---

## 🛠️ Technology Stack

### Frontend
* **Framework**: Next.js (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Deployment**: Vercel

### Backend & Database
* **Database & Vector Search**: Supabase PostgreSQL with `pgvector`
* **Authentication & Storage**: Supabase Auth & Supabase Storage (secured via Row Level Security)

### Face Recognition API
* **Language & Framework**: Python, FastAPI, Uvicorn
* **AI Core**: InsightFace (`0.7.3`) with `Buffalo_SC` model pack
* **Detector**: SCRFD via `ONNX Runtime` CPU execution
* **Image Processing**: OpenCV & Pillow (with pre-inference image resizing optimization)

---

## 🏗️ System Architecture & Flow

```text
                  EVENT CREATION
                         │
                         ▼
                 Upload Event Photos
                         │
                         ▼
                 Supabase Storage
                         │
                         ▼
                  Face Recognition API
                         │
                         ▼
              InsightFace Buffalo_SC
                         │
                         ▼
                     SCRFD
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
           Face 1                Face 2...
              │
              ▼
        512-D Embedding
              │
              ▼
         Supabase pgvector