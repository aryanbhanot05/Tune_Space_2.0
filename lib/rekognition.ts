import { DetectFacesCommand, RekognitionClient } from "@aws-sdk/client-rekognition";
import { Buffer } from "buffer";
// **THE FIX**: Import the config from our new file.
import { awsConfig } from "./config";

// **THE FIX**: Use the imported config object for credentials.
const rekognition = new RekognitionClient({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
  },
});

export async function analyzeImageForEmotion(base64: string) {
  const buffer = Buffer.from(base64, 'base64');

  const command = new DetectFacesCommand({
    Image: { Bytes: buffer },
    Attributes: ["ALL"],
  });

  try {
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