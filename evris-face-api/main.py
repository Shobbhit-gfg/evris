from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace

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
    version="2.0.0"
)


# ============================================================
# CORS
# ============================================================
# IMPORTANT:
# Your current Vercel deployment is:
# https://evris-f1zjytuzh-shobhhit.vercel.app
#
# The browser was receiving HTTP 200 from Render, but the
# response was blocked because this origin was not allowed.
# ============================================================

app.add_middleware(
    CORSMiddleware,

    # Allow the production frontend and local development
    allow_origins=[
        "https://evris.vercel.app",
        "http://localhost:3000",
    ],

    # Automatically allow Vercel preview/deployment URLs
    allow_origin_regex=r"https://.*\.vercel\.app",

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# DEBUG DIRECTORY
# ============================================================

os.makedirs("debug_faces", exist_ok=True)


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "status": "EVRIS Face API Running",
        "service": "Face Embedding Service",
        "model": "Facenet512",
        "detector": "opencv",
        "dimensions": 512
    }


# ============================================================
# FACE VECTOR EXTRACTION
# ============================================================

@app.post("/extract-vector")
async def extract_vector(file: UploadFile = File(...)):

    start_time = time.time()
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


        # ----------------------------------------------------
        # Resize large images
        # ----------------------------------------------------

        MAX_WIDTH = 1200

        if img.shape[1] > MAX_WIDTH:

            scale = MAX_WIDTH / img.shape[1]

            img = cv2.resize(
                img,
                (
                    int(img.shape[1] * scale),
                    int(img.shape[0] * scale)
                )
            )

            cv2.imwrite(
                temp_path,
                img
            )

            print("\nIMAGE RESIZED")
            print("NEW WIDTH:", img.shape[1])
            print("NEW HEIGHT:", img.shape[0])


        height, width = img.shape[:2]


        # ----------------------------------------------------
        # Debug information
        # ----------------------------------------------------

        print("\n")
        print("================================================")
        print("EVRIS FACE EXTRACTION (RENDER SAFE)")
        print("================================================")
        print("FILE:", file.filename)
        print("WIDTH:", width)
        print("HEIGHT:", height)
        print("MODEL: Facenet512")
        print("DETECTOR: opencv")
        print("================================================")


        # ----------------------------------------------------
        # 4. Generate embeddings
        # ----------------------------------------------------

        results = DeepFace.represent(
            img_path=temp_path,
            model_name="Facenet512",
            detector_backend="opencv",
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

            # ------------------------------------------------
            # Face bounding box
            # ------------------------------------------------

            face_area = res.get(
                "facial_area",
                {}
            )

            x = int(
                face_area.get(
                    "x",
                    0
                )
            )

            y = int(
                face_area.get(
                    "y",
                    0
                )
            )

            w = int(
                face_area.get(
                    "w",
                    0
                )
            )

            h = int(
                face_area.get(
                    "h",
                    0
                )
            )


            # ------------------------------------------------
            # Detection confidence
            # ------------------------------------------------

            confidence = float(
                face_area.get(
                    "confidence",
                    res.get(
                        "face_confidence",
                        0
                    )
                ) or 0
            )


            # ------------------------------------------------
            # Debug face information
            # ------------------------------------------------

            print("\n--------------------------------")
            print(f"FACE {i + 1}")
            print("--------------------------------")
            print("x:", x)
            print("y:", y)
            print("w:", w)
            print("h:", h)
            print("confidence:", confidence)


            # ------------------------------------------------
            # Ignore invalid detections
            # ------------------------------------------------

            if w <= 0 or h <= 0:

                print(
                    "❌ Invalid face dimensions"
                )

                continue


            # ------------------------------------------------
            # Ignore extremely small detections
            # ------------------------------------------------

            if w < 15 or h < 15:

                print(
                    "⚠️ Extremely small face ignored"
                )

                continue


            # ------------------------------------------------
            # Get embedding
            # ------------------------------------------------

            raw_embedding = res.get(
                "embedding"
            )

            if raw_embedding is None:

                print(
                    "❌ No embedding returned"
                )

                continue


            # ------------------------------------------------
            # Convert embedding to NumPy
            # ------------------------------------------------

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

            if not np.all(
                np.isfinite(vector)
            ):

                print(
                    "❌ Embedding contains invalid values"
                )

                continue


            # ------------------------------------------------
            # L2 NORMALIZATION
            # ------------------------------------------------

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


            # ------------------------------------------------
            # Store face information
            # ------------------------------------------------

            detected_faces.append({
                "index": i + 1,
                "x": x,
                "y": y,
                "width": w,
                "height": h,
                "confidence": confidence
            })


            print(
                "✅ FACE EMBEDDING ACCEPTED"
            )


        # ----------------------------------------------------
        # 7. Final response
        # ----------------------------------------------------

        print("\n")
        print("================================================")
        print("EXTRACTION COMPLETE")
        print("================================================")
        print(
            "Detected:",
            len(results)
        )
        print(
            "Accepted:",
            len(embeddings)
        )
        print(
            "TOTAL TIME:",
            round(
                time.time() - start_time,
                2
            ),
            "seconds"
        )
        print("================================================")


        return {
            "success": True,
            "model": "Facenet512",
            "detector": "opencv",
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