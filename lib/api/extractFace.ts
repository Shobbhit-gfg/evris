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

    if (!Array.isArray(result.embedding)) {
      throw new Error("Face API did not return a valid embedding");
    }

    if (result.embedding.length !== 512) {
      throw new Error(
        `Expected 512-dimensional vector, received ${result.embedding.length}`
      );
    }

    console.log(
      `✅ Received valid 512-dimensional face vector`
    );

    return result.embedding;
  } catch (error) {
    console.error("❌ Face extraction failed:", error);
    return null;
  }
}