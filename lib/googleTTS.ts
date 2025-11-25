import { googleCloudConfig } from './config';

const API_KEY = googleCloudConfig.apiKey;
const TTS_API_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

/**
 * Calls the Google Cloud Text-to-Speech API to convert text into audio.
 * @param text The text string to be synthesized into speech.
 * @returns A promise that resolves with the base64-encoded audio string, or null if an error occurs.
 */
export async function fetchAudioFromText(text: string): Promise<string | null> {
  try {
    const response = await fetch(TTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          text: text,
        },
        voice: {
          languageCode: 'en-US',
          name: 'en-us-Chirp3-HD-Leda', // A friendly, "cheerful" female voice
        },
        audioConfig: {
          audioEncoding: 'MP3',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google TTS API Error:', errorData.error.message);
      throw new Error(`Google TTS API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.audioContent) {
      return data.audioContent;
    } else {
      console.warn('No audio content received from Google TTS API.');
      return null;
    }

  } catch (error) {
    console.error('Error fetching TTS audio:', error);
    return null;
  }
}