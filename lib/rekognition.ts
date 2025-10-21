import { DetectFacesCommand, RekognitionClient } from "@aws-sdk/client-rekognition";
import { Buffer } from "buffer";
import { awsConfig } from "./config";

// Create a lazy-loaded Rekognition client to avoid dynamic import issues
let rekognitionClient: RekognitionClient | null = null;

const getRekognitionClient = () => {
  if (!rekognitionClient) {
    rekognitionClient = new RekognitionClient({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
    });
  }
  return rekognitionClient;
};

export async function analyzeImageForEmotion(base64: string) {
  const buffer = Buffer.from(base64, 'base64');

  const command = new DetectFacesCommand({
    Image: { Bytes: buffer },
    Attributes: ["ALL"],
  });

  try {
    const rekognition = getRekognitionClient();
    const response = await rekognition.send(command);
    const faceDetails = response.FaceDetails;

    if (faceDetails && faceDetails.length > 0) {
      const emotions = faceDetails[0].Emotions;
      if (emotions && emotions.length > 0) {
        const dominantEmotion = emotions.reduce((prev, current) =>
          (prev.Confidence! > current.Confidence!) ? prev : current
        );
        return dominantEmotion.Type || 'DEFAULT';
      }
    }
    return 'NEUTRAL';
  } catch (error: any) {
    console.error("AWS Rekognition Error:", error);
    throw new Error(`Failed to analyze image: ${error.name}`);
  }
}

// This code is provided from AI
// type AI used Gemini 2.5 pro