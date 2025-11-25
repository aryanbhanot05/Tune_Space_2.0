// lib/config.ts

// Helper to ensure the key exists to prevent runtime crashes
function getEnvVar(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}. Please check your .env file.`);
  }
  return value;
}

// Export configuration objects
export const awsConfig = {
  accessKeyId: getEnvVar('EXPO_PUBLIC_AWS_ACCESS_KEY_ID', process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID),
  secretAccessKey: getEnvVar('EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY', process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY),
  region: 'us-east-2',
};

export const spotifyConfig = {
  clientId: getEnvVar('EXPO_PUBLIC_SPOTIFY_CLIENT_ID', process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID),
};

export const googleCloudConfig = {
  apiKey: getEnvVar('EXPO_PUBLIC_GOOGLE_TTS_API_KEY', process.env.EXPO_PUBLIC_GOOGLE_TTS_API_KEY),
};