// Set to true if you are running FastAPI locally via uvicorn, false if testing against Render
const USE_LOCAL_API = false;

const FACE_API_URL = USE_LOCAL_API
  ? "http://127.0.0.1:8000"
  : process.env.NEXT_PUBLIC_FACE_API_URL || "https://evris-face-api.onrender.com";

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
 * Extracts multiple face embeddings from an image (ideal for event uploads & multi-face crowds).
 */
export async function getFaceEmbeddingsFromServer(
  file: File
): Promise<number[][]> {
  const formData = new FormData();
  formData.append("file", file);

  console.log(`🐍 Sending image to Face API (${FACE_API_URL}):`, file.name);

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

  const data: FaceEmbeddingResponse = await response.json();

  console.log("🐍 Face API response:", data);

  if (!data.success) {
    throw new Error(
      data.error || "Face extraction failed."
    );
  }

  const embeddings = data.embeddings || [];

  console.log(
    `🧠 Faces returned by Python: ${embeddings.length}`
  );

  return embeddings.filter(
    (embedding) =>
      Array.isArray(embedding) &&
      embedding.length === 512
  );
}

/**
 * Extracts a single primary face embedding (backward compatible wrapper for selfie searches).
 */
export async function getFaceEmbeddingFromServer(
  file: File
): Promise<number[] | null> {
  try {
    const embeddings = await getFaceEmbeddingsFromServer(file);

    if (embeddings.length === 0) {
      throw new Error(
        "No face detected in the image. Please upload a clearer photo with your face clearly visible."
      );
    }

    console.log("✅ Received valid 512-dimensional face vector");
    return embeddings[0];
  } catch (error: any) {
    console.error("❌ Face extraction failed:", error);
    const errorMessage =
      error?.message ||
      "Unable to process face. Please try a different photo.";
    throw new Error(errorMessage);
  }
}