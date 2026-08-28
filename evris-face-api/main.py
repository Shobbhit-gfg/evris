from fastapi import FastAPI, UploadFile, File 
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
import tempfile
import os
import numpy as np

app = FastAPI(title="evris Face Recognition API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "status": "evris Face API Running",
        "service": "Face Embedding Service"
    }

@app.post("/extract-vector")
async def extract_vector(file: UploadFile = File(...)):
    temp_path = None

    try:
        suffix = os.path.splitext(file.filename or ".jpg")[1]

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:
            contents = await file.read()
            temp_file.write(contents)
            temp_path = temp_file.name

        # Generate FaceNet512 embeddings
        results = DeepFace.represent(
            img_path=temp_path,
            model_name="Facenet512",
            detector_backend="retinaface",
            enforce_detection=False,
            align=True
        )

        # Extract and L2 Normalize all face embeddings
        embeddings = []
        for res in results:
            # Optional size check to filter out tiny background artifacts if needed
            face_area = res.get("facial_area", {})
            w = face_area.get("w", 0)
            h = face_area.get("h", 0)
            if w > 0 and h > 0 and (w < 30 or h < 30):
                continue

            raw_vector = np.array(res["embedding"])
            
            # L2 Normalize the vector so Cosine Similarity works precisely in Supabase
            norm = np.linalg.norm(raw_vector)
            if norm > 0:
                normalized_vector = (raw_vector / norm).tolist()
                embeddings.append(normalized_vector)

        return {
            "success": True,
            "model": "Facenet512",
            "face_count": len(embeddings),
            "embeddings": embeddings
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)