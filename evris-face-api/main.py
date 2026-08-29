from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace

import tempfile
import os
import numpy as np
import cv2


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="EVRIS Face Recognition API",
    version="2.0.0"
)


# ============================================================
# CORS
# ============================================================

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


# ============================================================
# DEBUG DIRECTORY
# ============================================================

os.makedirs("debug_faces", exist_ok=True)


# ============================================================
# MODEL WARMUP (PREVENTS COLD START DELAY)
# ============================================================

@app.on_event("startup")
async def startup_event():
    print("\n================================================")
    print("🔥 WARMING UP AI MODELS (YOLOv8 + Facenet512)...")
    print("================================================")
    
    dummy_img = np.zeros((200, 200, 3), dtype=np.uint8)
    temp_dummy = "warmup_temp.jpg"
    cv2.imwrite(temp_dummy, dummy_img)
    
    try:
        DeepFace.represent(
            img_path=temp_dummy,
            model_name="Facenet512",
            detector_backend="yolov8",
            enforce_detection=False
        )
        print("🚀 DeepFace (Facenet512 + YOLOv8) loaded into memory!")
    except Exception as e:
        print("⚠️ Warmup note:", e)
    finally:
        if os.path.exists(temp_dummy):
            os.remove(temp_dummy)
            
    print("================================================\n")


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "status": "EVRIS Face API Running",
        "service": "Face Embedding Service",
        "model": "Facenet512",
        "detector": "YOLOv8",
        "dimensions": 512
    }


# ============================================================
# FACE VECTOR EXTRACTION
# ============================================================

@app.post("/extract-vector")
async def extract_vector(file: UploadFile = File(...)):

    temp_path = None

    try:

        # ----------------------------------------------------
        # 1. Validate file
        # ----------------------------------------------------

        if not file.filename:
            return {
                "success": False,
                "error": "No filename supplied."
            }

        suffix = os.path.splitext(file.filename)[1].lower()

        if suffix not in [".jpg", ".jpeg", ".png", ".webp"]:
            suffix = ".jpg"


        # ----------------------------------------------------
        # 2. Save uploaded image temporarily
        # ----------------------------------------------------

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            contents = await file.read()

            if not contents:
                return {
                    "success": False,
                    "error": "Uploaded file is empty."
                }

            temp_file.write(contents)

            temp_path = temp_file.name


        # ----------------------------------------------------
        # 3. Read image with OpenCV
        # ----------------------------------------------------

        img = cv2.imread(temp_path)

        if img is None:
            return {
                "success": False,
                "error": "Unable to read uploaded image."
            }


        height, width = img.shape[:2]
        
        # ----------------------------------------------------
        # 3.5 AGGRESSIVE DOWNSCALE FOR SPEED (800px)
        # ----------------------------------------------------
        max_dim = 800

        if max(height, width) > max_dim:
            scale = max_dim / float(max(height, width))
            new_w = int(width * scale)
            new_h = int(height * scale)
            
            # Resize image
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
            
            # Overwrite the temp file with the downscaled version
            cv2.imwrite(temp_path, img)
            
            # Update vars for logging
            width, height = new_w, new_h
            
            is_resized = True
        else:
            is_resized = False


        print("\n")
        print("================================================")
        print("EVRIS FACE EXTRACTION (ULTRA-FAST)")
        print("================================================")
        print("FILE:", file.filename)
        print("WIDTH:", width)
        print("HEIGHT:", height)
        if is_resized:
            print("STATUS: Downscaled to 800px for speed ⚡")
        print("MODEL: Facenet512")
        print("DETECTOR: YOLOv8")
        print("================================================")


        # ----------------------------------------------------
        # 4. Generate embeddings with YOLOv8
        # ----------------------------------------------------

        results = DeepFace.represent(
            img_path=temp_path,

            model_name="Facenet512",

            detector_backend="yolov8",

            enforce_detection=False,

            align=True,

            normalization="Facenet"
        )


        # ----------------------------------------------------
        # 5. Make sure result is a list
        # ----------------------------------------------------

        if not isinstance(results, list):
            results = [results]


        print("FACES DETECTED:", len(results))


        # ----------------------------------------------------
        # 6. Process every detected face
        # ----------------------------------------------------

        embeddings = []

        detected_faces = []


        for i, res in enumerate(results):

            face_area = res.get(
                "facial_area",
                {}
            )

            x = int(face_area.get("x", 0))
            y = int(face_area.get("y", 0))

            w = int(face_area.get("w", 0))
            h = int(face_area.get("h", 0))


            # ------------------------------------------------
            # Detection confidence
            # ------------------------------------------------

            confidence = float(
                face_area.get(
                    "confidence",
                    res.get("face_confidence", 0)
                ) or 0
            )


            print("\n--------------------------------")
            print(f"FACE {i + 1}")
            print("--------------------------------")
            print("x:", x)
            print("y:", y)
            print("w:", w)
            print("h:", h)
            print("confidence:", confidence)


            # ------------------------------------------------
            # Ignore completely invalid detections
            # ------------------------------------------------

            if w <= 0 or h <= 0:

                print("❌ Invalid face dimensions")
                continue


            # ------------------------------------------------
            # Ignore tiny background artifacts
            # ------------------------------------------------

            if w < 15 or h < 15:

                print("⚠️ Extremely small face ignored")
                continue


            # ------------------------------------------------
            # Get embedding
            # ------------------------------------------------

            raw_embedding = res.get("embedding")

            if raw_embedding is None:

                print("❌ No embedding returned")
                continue


            vector = np.asarray(
                raw_embedding,
                dtype=np.float32
            )


            # ------------------------------------------------
            # Verify dimensions
            # ------------------------------------------------

            if vector.shape[0] != 512:

                print(
                    "❌ Invalid embedding dimension:",
                    vector.shape[0]
                )

                continue


            # ------------------------------------------------
            # Remove NaN / Infinity
            # ------------------------------------------------

            if not np.all(np.isfinite(vector)):

                print(
                    "❌ Embedding contains invalid values"
                )

                continue


            # ------------------------------------------------
            # L2 NORMALIZATION
            # ------------------------------------------------

            norm = np.linalg.norm(vector)


            if norm <= 0:

                print("❌ Zero vector")
                continue


            normalized_vector = (
                vector / norm
            ).astype(
                np.float32
            )


            # ------------------------------------------------
            # Final numerical validation
            # ------------------------------------------------

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


            # ------------------------------------------------
            # Store embedding
            # ------------------------------------------------

            embeddings.append(
                normalized_vector.tolist()
            )


            detected_faces.append({
                "index": i + 1,
                "x": x,
                "y": y,
                "width": w,
                "height": h,
                "confidence": confidence
            })


            print("✅ FACE EMBEDDING ACCEPTED")


        # ----------------------------------------------------
        # 7. Final response
        # ----------------------------------------------------

        print("\n")
        print("================================================")
        print("EXTRACTION COMPLETE")
        print("================================================")
        print("Detected:", len(results))
        print("Accepted:", len(embeddings))
        print("================================================")


        return {
            "success": True,

            "model": "Facenet512",

            "detector": "YOLOv8",

            "dimensions": 512,

            "face_count": len(embeddings),

            "faces": detected_faces,

            "embeddings": embeddings
        }


    # ========================================================
    # ERROR
    # ========================================================

    except Exception as e:

        print("\n")
        print("================================================")
        print("❌ EVRIS FACE API ERROR")
        print("================================================")
        print(str(e))
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

                if os.path.exists(temp_path):
                    os.remove(temp_path)

            except Exception as cleanup_error:

                print(
                    "⚠️ Temporary file cleanup failed:",
                    cleanup_error
                )