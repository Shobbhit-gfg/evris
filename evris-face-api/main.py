from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from insightface.app import FaceAnalysis

import tempfile
import os
import numpy as np
import cv2
import time


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="EVRIS Face Recognition API",
    version="3.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "https://evris.vercel.app",
        "http://localhost:3000",
    ],

    # Allow Vercel preview/deployment URLs
    allow_origin_regex=r"https://.*\.vercel\.app",

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# CONFIGURATION
# ============================================================

MAX_WIDTH = 1200

MIN_FACE_WIDTH = 15
MIN_FACE_HEIGHT = 15

EMBEDDING_DIMENSIONS = 512

MODEL_NAME = "buffalo_l"
DETECTOR_NAME = "SCRFD"

# CPU is intentionally used for Render compatibility.
PROVIDERS = ["CPUExecutionProvider"]

DET_SIZE = (640, 640)


# ============================================================
# DEBUG DIRECTORY
# ============================================================

os.makedirs("debug_faces", exist_ok=True)


# ============================================================
# INSIGHTFACE MODEL
# ============================================================
#
# IMPORTANT:
# The model is loaded ONCE when the FastAPI application starts.
#
# We do NOT initialize FaceAnalysis inside /extract-vector.
#
# This is critical for performance because loading Buffalo_L
# for every uploaded image would be extremely slow.
# ============================================================

print("")
print("================================================")
print("EVRIS FACE API")
print("================================================")
print("Initializing InsightFace...")
print("Model:", MODEL_NAME)
print("Detector:", DETECTOR_NAME)
print("Providers:", PROVIDERS)
print("Detection size:", DET_SIZE)
print("================================================")


model_start_time = time.time()

try:

    face_app = FaceAnalysis(
        name=MODEL_NAME,
        providers=PROVIDERS
    )

    face_app.prepare(
        ctx_id=0,
        det_size=DET_SIZE
    )

    model_load_time = time.time() - model_start_time

    print("✅ InsightFace initialized successfully")
    print(
        "Model load time:",
        round(model_load_time, 2),
        "seconds"
    )

except Exception as e:

    face_app = None

    print("")
    print("================================================")
    print("❌ INSIGHTFACE INITIALIZATION FAILED")
    print("================================================")
    print(str(e))
    print("================================================")


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "status": "EVRIS Face API Running",
        "service": "Face Embedding Service",
        "model": "Buffalo_L",
        "detector": "SCRFD",
        "dimensions": EMBEDDING_DIMENSIONS,
        "runtime": "ONNX Runtime",
        "provider": "CPUExecutionProvider"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    if face_app is None:

        return {
            "status": "unhealthy",
            "model_loaded": False
        }

    return {
        "status": "healthy",
        "model_loaded": True,
        "model": "Buffalo_L",
        "detector": "SCRFD",
        "dimensions": EMBEDDING_DIMENSIONS,
        "provider": "CPUExecutionProvider"
    }


# ============================================================
# FACE VECTOR EXTRACTION
# ============================================================

@app.post("/extract-vector")
async def extract_vector(file: UploadFile = File(...)):

    start_time = time.time()

    temp_path = None

    try:

        # ====================================================
        # 0. Check model
        # ====================================================

        if face_app is None:

            return {
                "success": False,
                "error": "Face recognition model is not initialized."
            }


        # ====================================================
        # 1. Validate filename
        # ====================================================

        if not file.filename:

            return {
                "success": False,
                "error": "No filename supplied."
            }


        suffix = os.path.splitext(
            file.filename
        )[1].lower()


        if suffix not in [
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        ]:

            suffix = ".jpg"


        # ====================================================
        # 2. Read uploaded file
        # ====================================================

        contents = await file.read()


        if not contents:

            return {
                "success": False,
                "error": "Uploaded file is empty."
            }


        # ====================================================
        # 3. Save temporary file
        # ====================================================

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            temp_file.write(contents)

            temp_path = temp_file.name


        # ====================================================
        # 4. Read image
        # ====================================================

        preprocess_start = time.time()

        img = cv2.imread(
            temp_path
        )


        if img is None:

            return {
                "success": False,
                "error": "Unable to read uploaded image."
            }


        original_height, original_width = img.shape[:2]


        # ====================================================
        # 5. Resize large images
        # ====================================================

        resized = False

        if img.shape[1] > MAX_WIDTH:

            scale = MAX_WIDTH / img.shape[1]

            new_width = int(
                img.shape[1] * scale
            )

            new_height = int(
                img.shape[0] * scale
            )

            img = cv2.resize(
                img,
                (
                    new_width,
                    new_height
                ),
                interpolation=cv2.INTER_AREA
            )

            resized = True


        height, width = img.shape[:2]

        preprocess_time = (
            time.time() - preprocess_start
        )


        # ====================================================
        # 6. Debug information
        # ====================================================

        print("")
        print("================================================")
        print("EVRIS FACE EXTRACTION")
        print("================================================")
        print("FILE:", file.filename)

        print(
            "ORIGINAL SIZE:",
            f"{original_width}x{original_height}"
        )

        print(
            "PROCESSING SIZE:",
            f"{width}x{height}"
        )

        print(
            "RESIZED:",
            resized
        )

        print("MODEL:", MODEL_NAME)
        print("DETECTOR:", DETECTOR_NAME)
        print("DIMENSIONS:", EMBEDDING_DIMENSIONS)

        print(
            "PREPROCESS TIME:",
            round(preprocess_time, 3),
            "seconds"
        )

        print("================================================")


        # ====================================================
        # 7. Face detection + embedding extraction
        # ====================================================

        inference_start = time.time()

        faces = face_app.get(
            img
        )

        inference_time = (
            time.time() - inference_start
        )


        print(
            "FACES DETECTED:",
            len(faces)
        )

        print(
            "INFERENCE TIME:",
            round(inference_time, 3),
            "seconds"
        )


        # ====================================================
        # 8. Process detected faces
        # ====================================================

        embeddings = []

        detected_faces = []


        for i, face in enumerate(faces):

            # =================================================
            # Bounding box
            # =================================================

            bbox = face.bbox


            if bbox is None or len(bbox) < 4:

                print(
                    f"❌ FACE {i + 1}: Invalid bounding box"
                )

                continue


            x1 = int(
                max(
                    0,
                    bbox[0]
                )
            )

            y1 = int(
                max(
                    0,
                    bbox[1]
                )
            )

            x2 = int(
                min(
                    width,
                    bbox[2]
                )
            )

            y2 = int(
                min(
                    height,
                    bbox[3]
                )
            )


            face_width = x2 - x1
            face_height = y2 - y1


            # =================================================
            # Detection confidence
            # =================================================

            confidence = float(
                getattr(
                    face,
                    "det_score",
                    0.0
                )
            )


            # =================================================
            # Debug information
            # =================================================

            print("")
            print("--------------------------------")
            print(f"FACE {i + 1}")
            print("--------------------------------")
            print("x:", x1)
            print("y:", y1)
            print("width:", face_width)
            print("height:", face_height)
            print(
                "confidence:",
                round(
                    confidence,
                    4
                )
            )


            # =================================================
            # Validate dimensions
            # =================================================

            if face_width <= 0 or face_height <= 0:

                print(
                    "❌ Invalid face dimensions"
                )

                continue


            # =================================================
            # Ignore extremely small faces
            # =================================================

            if (
                face_width < MIN_FACE_WIDTH
                or
                face_height < MIN_FACE_HEIGHT
            ):

                print(
                    "⚠️ Extremely small face ignored"
                )

                continue


            # =================================================
            # Get embedding
            # =================================================

            raw_embedding = getattr(
                face,
                "embedding",
                None
            )


            if raw_embedding is None:

                print(
                    "❌ No embedding returned"
                )

                continue


            # =================================================
            # Convert to NumPy
            # =================================================

            vector = np.asarray(
                raw_embedding,
                dtype=np.float32
            )


            # =================================================
            # Verify dimensions
            # =================================================

            if vector.ndim != 1:

                print(
                    "❌ Invalid embedding shape:",
                    vector.shape
                )

                continue


            if vector.shape[0] != EMBEDDING_DIMENSIONS:

                print(
                    "❌ Invalid embedding dimension:",
                    vector.shape[0]
                )

                continue


            # =================================================
            # Remove NaN / Infinity
            # =================================================

            if not np.all(
                np.isfinite(vector)
            ):

                print(
                    "❌ Embedding contains invalid values"
                )

                continue


            # =================================================
            # L2 NORMALIZATION
            # =================================================

            norm = np.linalg.norm(
                vector
            )


            if norm <= 0:

                print(
                    "❌ Zero vector"
                )

                continue


            normalized_vector = (
                vector / norm
            ).astype(
                np.float32
            )


            # =================================================
            # Final validation
            # =================================================

            final_norm = np.linalg.norm(
                normalized_vector
            )


            print(
                "Embedding dimensions:",
                len(normalized_vector)
            )

            print(
                "Original norm:",
                float(norm)
            )

            print(
                "Final norm:",
                float(final_norm)
            )


            # =================================================
            # Store embedding
            # =================================================

            embeddings.append(
                normalized_vector.tolist()
            )


            # =================================================
            # Store face information
            # =================================================

            detected_faces.append({
                "index": i + 1,
                "x": x1,
                "y": y1,
                "width": face_width,
                "height": face_height,
                "confidence": confidence
            })


            print(
                "✅ FACE EMBEDDING ACCEPTED"
            )


        # ====================================================
        # 9. Final timing
        # ====================================================

        total_time = (
            time.time() - start_time
        )


        # ====================================================
        # 10. Final logs
        # ====================================================

        print("")
        print("================================================")
        print("EXTRACTION COMPLETE")
        print("================================================")

        print(
            "Detected:",
            len(faces)
        )

        print(
            "Accepted:",
            len(embeddings)
        )

        print(
            "Preprocess:",
            round(
                preprocess_time,
                3
            ),
            "seconds"
        )

        print(
            "Inference:",
            round(
                inference_time,
                3
            ),
            "seconds"
        )

        print(
            "Total:",
            round(
                total_time,
                3
            ),
            "seconds"
        )

        print("================================================")


        # ====================================================
        # 11. Final response
        # ====================================================

        return {
            "success": True,

            "model": "Buffalo_L",

            "detector": "SCRFD",

            "dimensions": EMBEDDING_DIMENSIONS,

            "face_count": len(embeddings),

            "faces": detected_faces,

            "embeddings": embeddings,

            "processing_time": round(
                total_time,
                3
            )
        }


    # ========================================================
    # ERROR
    # ========================================================

    except Exception as e:

        print("")
        print("================================================")
        print("❌ EVRIS FACE API ERROR")
        print("================================================")
        print(
            "FILE:",
            file.filename if file else "unknown"
        )
        print(
            "ERROR:",
            str(e)
        )
        print("================================================")


        return {
            "success": False,
            "error": str(e)
        }


    # ========================================================
    # CLEANUP
    # ========================================================

    finally:

        if temp_path:

            try:

                if os.path.exists(
                    temp_path
                ):

                    os.remove(
                        temp_path
                    )

            except Exception as cleanup_error:

                print(
                    "⚠️ Temporary file cleanup failed:",
                    cleanup_error
                )

