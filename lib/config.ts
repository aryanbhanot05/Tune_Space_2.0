import Constants from 'expo-constants';

// A helper function to safely get variables from the app manifest (app.json).
const getExtraVar = <T>(key: string): T => {
  const value = Constants.expoConfig?.extra?.[key];
  if (value === undefined || value === null) {
    throw new Error(`The environment variable "${key}" is missing in app.json.`);
  }
  return value as T;
};

// Define and export your configuration variables.
export const awsConfig = {
  accessKeyId: getExtraVar<string>('EXPO_PUBLIC_AWS_ACCESS_KEY_ID'),
  secretAccessKey: getExtraVar<string>('EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY'),
  region: 'us-east-2', 
};

export const spotifyConfig = {
  clientId: getExtraVar<string>('EXPO_PUBLIC_SPOTIFY_CLIENT_ID'),
};

// This code is provided from AI
// type AI used Gemini 2.5 pro