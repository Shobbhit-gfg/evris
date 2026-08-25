import * as faceapi from "@vladmandic/face-api";

let modelsLoaded = false;

export async function loadFaceModels() {
  if (modelsLoaded) return;
  
  // This points to the /public/models directory in Next.js
  const MODEL_URL = "/models"; 
  
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  
  modelsLoaded = true;
}

/**
 * Extracts a 128-dimensional vector from an HTML Image Element.
 */
export async function getFaceEmbedding(imageElement: HTMLImageElement): Promise<number[] | null> {
  await loadFaceModels();
  
  // Detect face, find landmarks, and compute the 128-dimensional descriptor
  const detection = await faceapi
    .detectSingleFace(imageElement)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;

  // Convert the Float32Array to a standard JavaScript Array for pgvector
  return Array.from(detection.descriptor);
}