export async function getFaceEmbeddingFromServer(
  file: File
): Promise<number[] | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://127.0.0.1:8000/extract-vector", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `Face API returned HTTP ${response.status}`
      );
    }

    const result = await response.json();

    console.log("🐍 Face API response:", result);

    if (!result.success) {
      throw new Error(
        result.error || "Face vector extraction failed"
      );
    }

    // Handle case where FastAPI returns an array of embeddings (multi-face / group support)
    let selectedEmbedding: number[] | null = null;

    if (Array.isArray(result.embeddings) && result.embeddings.length > 0) {
      selectedEmbedding = result.embeddings[0];
    } else if (Array.isArray(result.embedding)) {
      // Fallback if legacy single embedding response is used
      selectedEmbedding = result.embedding;
    }

    if (!selectedEmbedding || !Array.isArray(selectedEmbedding)) {
      throw new Error("No face detected in the image. Please upload a clearer photo with your face clearly visible.");
    }

    if (selectedEmbedding.length !== 512) {
      throw new Error(
        `Expected 512-dimensional vector, received ${selectedEmbedding.length}`
      );
    }

    console.log(
      `✅ Received valid 512-dimensional face vector`
    );

    return selectedEmbedding;
  } catch (error: any) {
    console.error("❌ Face extraction failed:", error);
    
    // Rethrow a clean, user-friendly error message so the UI alert can catch it
    const errorMessage = error?.message || "Unable to process face. Please try a different photo.";
    throw new Error(errorMessage);
  }
}