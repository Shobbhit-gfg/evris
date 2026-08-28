from fastapi import FastAPI, UploadFile, File 
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
import tempfile
import os

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

        # Generate ArcFace embeddings for all detected faces (handles group shots & crowds)
        results = DeepFace.represent(
            img_path=temp_path,
            model_name="ArcFace",
            detector_backend="retinaface",
            enforce_detection=True
        )

        # Extract all face embeddings found in the image
        embeddings = [res["embedding"] for res in results]

        return {
            "success": True,
            "model": "ArcFace",
            "face_count": len(embeddings),
            "embeddings": embeddings
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

    finally:
        # Delete temporary image
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)