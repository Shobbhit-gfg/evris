// Set to true if you are running FastAPI locally via uvicorn.
// Set to false when using the deployed Render Face API.
const USE_LOCAL_API = false;

const FACE_API_URL = USE_LOCAL_API
  ? "http://127.0.0.1:8000"
  : "https://evris.onrender.com";

export type FaceEmbeddingResponse = {
  success: boolean;
  model?: string;
  detector?: string;
  dimensions?: number;
  face_count?: number;
  embeddings?: number[][];
  error?: string;
};

/**
 * Warm up the EVRIS Face API.
 *
 * This sends a lightweight request to the API so that
 * Render can wake the service from sleep before the
 * user performs a face search or event upload.
 *
 * This function never blocks the application.
 */
export async function warmUpFaceAPI(
  retries = 3,
  delayMs = 2000
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `🔥 Warming up EVRIS Face API... (${attempt}/${retries})`
      );

      const response = await fetch(`${FACE_API_URL}/health`, {
        method: "GET",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();

        console.log(
          "✅ EVRIS Face API is ready:",
          data
        );

        return true;
      }

      console.warn(
        `⚠️ Face API warm-up returned status ${response.status}`
      );
    } catch (error) {
      console.warn(
        `⚠️ Face API warm-up failed (attempt ${attempt}):`,
        error
      );
    }

    // Wait before trying again.
    if (attempt < retries) {
      await new Promise((resolve) =>
        setTimeout(resolve, delayMs)
      );
    }
  }

  console.warn(
    "❌ EVRIS Face API could not be warmed up."
  );

  return false;
}

/**
 * Automatically warm up the Face API when this module
 * is loaded in the browser.
 *
 * This runs in the background and does NOT block EVRIS.
 */
if (typeof window !== "undefined") {
  void warmUpFaceAPI();
}

/**
 * Extracts multiple face embeddings from an image.
 *
 * Ideal for:
 * - Event photo uploads
 * - Group photos
 * - Crowd photos
 * - Multiple faces in a single image
 */
export async function getFaceEmbeddingsFromServer(
  file: File
): Promise<number[][]> {
  const formData = new FormData();

  formData.append("file", file);

  console.log(
    `🐍 Sending image to Face API (${FACE_API_URL}):`,
    file.name
  );

  const response = await fetch(
    `${FACE_API_URL}/extract-vector`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Face API failed with status ${response.status}`
    );
  }

  const data: FaceEmbeddingResponse =
    await response.json();

  console.log(
    "🐍 Face API response:",
    data
  );

  if (!data.success) {
    throw new Error(
      data.error ||
        "Face extraction failed."
    );
  }

  const embeddings = data.embeddings || [];

  console.log(
    `🧠 Faces returned by Python: ${embeddings.length}`
  );

  /**
   * Only accept valid 512-dimensional embeddings.
   */
  const validEmbeddings = embeddings.filter(
    (embedding) =>
      Array.isArray(embedding) &&
      embedding.length === 512
  );

  console.log(
    `✅ Valid 512-D embeddings: ${validEmbeddings.length}`
  );

  return validEmbeddings;
}

/**
 * Extracts a single primary face embedding.
 *
 * Used for selfie-based face searches.
 *
 * This wrapper is backward compatible with the existing
 * EVRIS face-search implementation.
 */
export async function getFaceEmbeddingFromServer(
  file: File
): Promise<number[] | null> {
  try {
    const embeddings =
      await getFaceEmbeddingsFromServer(file);

    if (embeddings.length === 0) {
      throw new Error(
        "No face detected in the image. Please upload a clearer photo with your face clearly visible."
      );
    }

    console.log(
      "✅ Received valid 512-dimensional face vector"
    );

    return embeddings[0];
  } catch (error: any) {
    console.error(
      "❌ Face extraction failed:",
      error
    );

    const errorMessage =
      error?.message ||
      "Unable to process face. Please try a different photo.";

    throw new Error(errorMessage);
  }
}

