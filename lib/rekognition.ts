import { DetectFacesCommand, EmotionName, RekognitionClient } from "@aws-sdk/client-rekognition";
import { fromEnv } from "@aws-sdk/credential-providers";

const REGION = "us-east-2"; 

// Initialize the Rekognition client
const rekognitionClient = new RekognitionClient({
  region: REGION,
  credentials: fromEnv(),
});

/**
 * Analyzes a base64 encoded image for facial expressions.
 * @param imageBase64 The base64 string of the image.
 * @returns The dominant emotion detected, or null if no face is found.
 */
export async function analyzeImageForEmotion(imageBase64: string): Promise<EmotionName | null> {
  try {
    const imageBytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));

    const command = new DetectFacesCommand({
      Image: {
        Bytes: imageBytes,
      },
      Attributes: ["EMOTIONS"],
    });

    const response = await rekognitionClient.send(command);

    if (response.FaceDetails && response.FaceDetails.length > 0) {
      const emotions = response.FaceDetails[0].Emotions;
      if (emotions && emotions.length > 0) {
        // Find the emotion with the highest confidence
        const dominantEmotion = emotions.reduce((prev, current) => 
          (prev.Confidence! > current.Confidence!) ? prev : current
        );
        return dominantEmotion.Type as EmotionName;
      }
    }
    return null; // No face or emotions detected
  } catch (error) {
    console.error("Error analyzing image with Rekognition:", error);
    throw new Error("Failed to analyze image.");
  }
}