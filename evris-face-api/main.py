from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from insightface.app import FaceAnalysis

import os
import time
import gc

import cv2
import numpy as np


# ============================================================
# EVRIS FACE RECOGNITION API
# Optimized for Render Free Tier (~512 MB RAM)
# ============================================================


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="EVRIS Face Recognition API",
    version="3.2.0"
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

    allow_origin_regex=r"https://.*\.vercel\.app",

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# CONFIGURATION
# ============================================================

# ------------------------------------------------------------
# IMAGE PROCESSING
# ------------------------------------------------------------

# Maximum image width before inference.
#
# 960px is enough for most event photography while
# significantly reducing CPU/RAM usage compared with
# processing 3000-6000px original photographs.
#
MAX_WIDTH = 960


# ------------------------------------------------------------
# FACE FILTERING
# ------------------------------------------------------------

# Ignore extremely tiny detected faces.
#
# Keep this relatively low because event photos may contain
# people in the background.
#
MIN_FACE_WIDTH = 15
MIN_FACE_HEIGHT = 15


# ------------------------------------------------------------
# EMBEDDING
# ------------------------------------------------------------

# IMPORTANT:
#
# Buffalo_S ArcFace produces 512-dimensional embeddings.
#
# DO NOT reduce this to 256/128 by truncating the vector.
#
# Keeping 512 dimensions preserves compatibility with:
#
# Supabase pgvector vector(512)
# EVRIS match_faces RPC
# Existing stored embeddings
#
EMBEDDING_DIMENSIONS = 512


# ============================================================
# INSIGHTFACE
# ============================================================

MODEL_NAME = "buffalo_s"

DETECTOR_NAME = "SCRFD"


# CPU ONLY
#
# Render free tier does not provide a GPU.
#
PROVIDERS = [
    "CPUExecutionProvider"
]


# ------------------------------------------------------------
# DETECTION SIZE
# ------------------------------------------------------------
#
# 320x320 significantly reduces detection workload compared
# with 640x640 or 512x512.
#
# The original uploaded image is resized separately to
# MAX_WIDTH before inference.
#
DET_SIZE = (
    320,
    320
)


# ============================================================
# UPLOAD LIMIT
# ============================================================

# Maximum request image size:
# 15 MB
#
MAX_UPLOAD_SIZE = 15 * 1024 * 1024


# ============================================================
# ALLOWED IMAGE TYPES
# ============================================================

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}


# ============================================================
# STARTUP LOGGING
# ============================================================

print("")
print("================================================")
print("EVRIS FACE API")
print("================================================")
print("Model:", MODEL_NAME)
print("Detector:", DETECTOR_NAME)
print("Provider:", PROVIDERS[0])
print("Detection size:", DET_SIZE)
print("Max image width:", MAX_WIDTH)
print("Embedding dimensions:", EMBEDDING_DIMENSIONS)
print(
    "Max upload:",
    MAX_UPLOAD_SIZE // (1024 * 1024),
    "MB"
)
print("================================================")


# ============================================================
# LOAD INSIGHTFACE
# ============================================================

face_app = None

model_start_time = time.time()

try:

    print("Initializing InsightFace...")

    face_app = FaceAnalysis(
        name=MODEL_NAME,
        providers=PROVIDERS,
    )

    face_app.prepare(
        ctx_id=0,
        det_size=DET_SIZE,
    )

    model_load_time = time.time() - model_start_time

    print("")
    print("================================================")
    print("INSIGHTFACE READY")
    print("================================================")
    print("Model:", MODEL_NAME)
    print("Detector:", DETECTOR_NAME)
    print("Provider:", PROVIDERS[0])
    print(
        "Embedding dimensions:",
        EMBEDDING_DIMENSIONS
    )
    print(
        "Detection size:",
        DET_SIZE
    )
    print(
        "Model load time:",
        round(model_load_time, 2),
        "seconds"
    )
    print("================================================")


except Exception as e:

    face_app = None

    print("")
    print("================================================")
    print("INSIGHTFACE INITIALIZATION FAILED")
    print("================================================")
    print("ERROR:", str(e))
    print("================================================")


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "status": "EVRIS Face API Running",

        "service": "Face Embedding Service",

        "model": MODEL_NAME,

        "detector": DETECTOR_NAME,

        "dimensions": EMBEDDING_DIMENSIONS,

        "runtime": "ONNX Runtime",

        "provider": PROVIDERS[0],

        "detection_size": DET_SIZE,

        "max_width": MAX_WIDTH,

        "status_detail": (
            "Model loaded"
            if face_app is not None
            else "Model failed to load"
        ),
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    if face_app is None:

        return {
            "status": "unhealthy",

            "model_loaded": False,

            "model": MODEL_NAME,

            "detector": DETECTOR_NAME,

            "dimensions": EMBEDDING_DIMENSIONS,

            "provider": PROVIDERS[0],

            "detection_size": DET_SIZE,
        }


    return {
        "status": "healthy",

        "model_loaded": True,

        "model": MODEL_NAME,

        "detector": DETECTOR_NAME,

        "dimensions": EMBEDDING_DIMENSIONS,

        "provider": PROVIDERS[0],

        "detection_size": DET_SIZE,

        "max_width": MAX_WIDTH,
    }


# ============================================================
# FACE VECTOR EXTRACTION
# ============================================================

@app.post("/extract-vector")
async def extract_vector(
    file: UploadFile = File(...)
):

    request_start = time.time()

    img = None
    contents = None

    try:

        # ====================================================
        # 1. MODEL CHECK
        # ====================================================

        if face_app is None:

            return {
                "success": False,

                "error": (
                    "Face recognition model "
                    "is not initialized."
                ),
            }


        # ====================================================
        # 2. FILENAME CHECK
        # ====================================================

        filename = file.filename or ""

        if not filename:

            return {
                "success": False,

                "error": "No filename supplied.",
            }


        # ====================================================
        # 3. EXTENSION CHECK
        # ====================================================

        suffix = os.path.splitext(
            filename
        )[1].lower()


        if suffix not in ALLOWED_EXTENSIONS:

            return {
                "success": False,

                "error": (
                    "Unsupported image format. "
                    "Use JPG, JPEG, PNG, or WEBP."
                ),
            }


        # ====================================================
        # 4. READ FILE
        # ====================================================
        #
        # We intentionally avoid tempfile.NamedTemporaryFile.
        #
        # OpenCV can decode the image directly from memory.
        #
        # This eliminates:
        #
        # upload -> disk -> OpenCV
        #
        # and instead uses:
        #
        # upload -> memory -> OpenCV
        #
        # This is faster and simpler for Render.
        #
        contents = await file.read()


        if not contents:

            return {
                "success": False,

                "error": "Uploaded file is empty.",
            }


        # ====================================================
        # 5. FILE SIZE CHECK
        # ====================================================

        file_size = len(contents)


        if file_size > MAX_UPLOAD_SIZE:

            return {
                "success": False,

                "error": (
                    "Image is too large. "
                    f"Maximum allowed size is "
                    f"{MAX_UPLOAD_SIZE // (1024 * 1024)} MB."
                ),
            }


        # ====================================================
        # 6. DECODE IMAGE
        # ====================================================

        preprocess_start = time.time()


        # Convert uploaded bytes into a NumPy uint8 buffer.
        #
        image_buffer = np.frombuffer(
            contents,
            dtype=np.uint8,
        )


        img = cv2.imdecode(
            image_buffer,
            cv2.IMREAD_COLOR,
        )


        # image_buffer is no longer needed.
        del image_buffer


        if img is None:

            return {
                "success": False,

                "error": "Unable to decode uploaded image.",
            }


        # ====================================================
        # 7. IMAGE DIMENSIONS
        # ====================================================

        original_height, original_width = img.shape[:2]


        if (
            original_width <= 0
            or original_height <= 0
        ):

            return {
                "success": False,

                "error": "Invalid image dimensions.",
            }


        # ====================================================
        # 8. RESIZE IMAGE
        # ====================================================

        resized = False


        if original_width > MAX_WIDTH:

            scale = (
                MAX_WIDTH
                /
                float(original_width)
            )


            new_width = MAX_WIDTH

            new_height = max(
                1,
                int(
                    original_height
                    *
                    scale
                )
            )


            img = cv2.resize(
                img,
                (
                    new_width,
                    new_height,
                ),
                interpolation=cv2.INTER_AREA,
            )


            resized = True


        height, width = img.shape[:2]


        preprocess_time = (
            time.time()
            -
            preprocess_start
        )


        # ====================================================
        # 9. INFERENCE
        # ====================================================

        inference_start = time.time()


        faces = face_app.get(img)


        inference_time = (
            time.time()
            -
            inference_start
        )


        detected_count = len(faces)


        print(
            f"[EVRIS] {filename} | "
            f"{original_width}x{original_height} -> "
            f"{width}x{height} | "
            f"faces={detected_count} | "
            f"inference={inference_time:.3f}s"
        )


        # ====================================================
        # 10. NO FACE
        # ====================================================

        if not faces:

            total_time = (
                time.time()
                -
                request_start
            )


            return {
                "success": True,

                "model": MODEL_NAME,

                "detector": DETECTOR_NAME,

                "dimensions": EMBEDDING_DIMENSIONS,

                "face_count": 0,

                "faces": [],

                "embeddings": [],

                "processing_time": round(
                    total_time,
                    3,
                ),
            }


        # ====================================================
        # 11. FACE PROCESSING
        # ====================================================

        embeddings = []

        detected_faces = []


        for index, face in enumerate(faces):

            # =================================================
            # BOUNDING BOX
            # =================================================

            bbox = getattr(
                face,
                "bbox",
                None,
            )


            if bbox is None or len(bbox) < 4:

                continue


            # Convert coordinates once.
            #
            x1 = max(
                0,
                int(bbox[0])
            )

            y1 = max(
                0,
                int(bbox[1])
            )

            x2 = min(
                width,
                int(bbox[2])
            )

            y2 = min(
                height,
                int(bbox[3])
            )


            face_width = x2 - x1

            face_height = y2 - y1


            # =================================================
            # FACE SIZE FILTER
            # =================================================

            if (
                face_width < MIN_FACE_WIDTH
                or
                face_height < MIN_FACE_HEIGHT
            ):

                continue


            # =================================================
            # DETECTION CONFIDENCE
            # =================================================

            confidence = float(
                getattr(
                    face,
                    "det_score",
                    0.0
                )
            )


            # =================================================
            # EMBEDDING
            # =================================================

            raw_embedding = getattr(
                face,
                "embedding",
                None
            )


            if raw_embedding is None:

                continue


            # =================================================
            # FLOAT32
            # =================================================

            vector = np.asarray(
                raw_embedding,
                dtype=np.float32,
            )


            # =================================================
            # DIMENSION CHECK
            # =================================================

            if (
                vector.ndim != 1
                or
                vector.shape[0]
                !=
                EMBEDDING_DIMENSIONS
            ):

                print(
                    f"[EVRIS] Invalid embedding "
                    f"for face {index + 1}: "
                    f"{vector.shape}"
                )

                continue


            # =================================================
            # FINITE CHECK
            # =================================================

            if not np.all(
                np.isfinite(vector)
            ):

                print(
                    f"[EVRIS] Invalid numeric "
                    f"embedding for face {index + 1}"
                )

                continue


            # =================================================
            # L2 NORMALIZATION
            # =================================================

            norm = np.linalg.norm(
                vector
            )


            if norm <= 0:

                continue


            vector /= norm


            # =================================================
            # FINAL FLOAT32
            # =================================================

            vector = vector.astype(
                np.float32,
                copy=False
            )


            # =================================================
            # STORE EMBEDDING
            # =================================================

            embeddings.append(
                vector.tolist()
            )


            # =================================================
            # STORE FACE METADATA
            # =================================================

            detected_faces.append({

                "index": index + 1,

                "x": x1,

                "y": y1,

                "width": face_width,

                "height": face_height,

                "confidence": confidence,
            })


        # ====================================================
        # 12. TOTAL TIME
        # ====================================================

        total_time = (
            time.time()
            -
            request_start
        )


        # ====================================================
        # 13. RESULT LOG
        # ====================================================

        print(
            f"[EVRIS] Accepted "
            f"{len(embeddings)}/{detected_count} faces | "
            f"total={total_time:.3f}s"
        )


        # ====================================================
        # 14. RESPONSE
        # ====================================================

        return {

            "success": True,

            "model": MODEL_NAME,

            "detector": DETECTOR_NAME,

            "dimensions": EMBEDDING_DIMENSIONS,

            "face_count": len(
                embeddings
            ),

            "faces": detected_faces,

            "embeddings": embeddings,

            "processing_time": round(
                total_time,
                3,
            ),
        }


    # ========================================================
    # ERROR HANDLING
    # ========================================================

    except Exception as e:

        print(
            "[EVRIS] Extraction error:",
            repr(e)
        )


        return {

            "success": False,

            "error": str(e),
        }


    # ========================================================
    # MEMORY CLEANUP
    # ========================================================

    finally:

        # Release uploaded bytes.
        contents = None

        # Release OpenCV image.
        img = None

        # Encourage Python to release temporary objects.
        #
        # This is useful on a small-memory container.
        #
        gc.collect()

