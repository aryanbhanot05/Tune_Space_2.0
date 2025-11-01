import { googleCloudConfig } from './config';

const API_KEY = googleCloudConfig.apiKey;
const TTS_API_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

/**
 * Calls the Google Cloud Text-to-Speech API to convert text into audio.
 * @param text The text string to be synthesized into speech.
 * @returns A promise that resolves with the base64-encoded audio string, or null if an error occurs.
 */
export async function fetchAudioFromText(text: string): Promise<string | null> {
  // A quick teaching moment:
  // This is the main API call. We send a 'fetch' request to Google's endpoint.
  // The 'body' of the request is a JSON object that tells Google exactly
  // what we want:
  // - input: { text: text } -> The text to speak.
  // - voice: { ... } -> The voice to use. I've picked a standard, neutral one.
  // - audioConfig: { audioEncoding: 'MP3' } -> We want the audio back as an MP3.
  
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
          ssmlGender: 'NEUTRAL',
          name: 'en-US-Standard-C' // This is a good, clear voice.
        },
        audioConfig: {
          audioEncoding: 'MP3',
        },
      }),
    });

    if (!response.ok) {
      // If Google sends back an error, we'll log it.
      const errorData = await response.json();
      console.error('Google TTS API Error:', errorData.error.message);
      throw new Error(`Google TTS API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // The API returns a JSON object. The audio data is inside
    // a property called 'audioContent'. It's already in base64 format,
    // which is exactly what we need for the next step.
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