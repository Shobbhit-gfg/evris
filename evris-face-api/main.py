from fastapi import FastAPI, UploadFile, File  # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
import tempfile
import os

app = FastAPI(title="EVRIS Face Recognition API")

# Add CORS Middleware to allow requests from Next.js frontend
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
        "status": "EVRIS Face API Running",
        "service": "Face Embedding Service"
    }

@app.post("/extract-vector")
async def extract_vector(file: UploadFile = File(...)):
    temp_path = None

    try:
        # Create temporary image file
        suffix = os.path.splitext(file.filename or ".jpg")[1]

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            contents = await file.read()
            temp_file.write(contents)
            temp_path = temp_file.name

        # Generate ArcFace embedding
        result = DeepFace.represent(
            img_path=temp_path,
            model_name="ArcFace",
            enforce_detection=True
        )

        embedding = result[0]["embedding"]

        return {
            "success": True,
            "model": "ArcFace",
            "dimensions": len(embedding),
            "embedding": embedding
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