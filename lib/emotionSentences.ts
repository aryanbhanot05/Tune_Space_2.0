/**
 * A dictionary of emotion-to-sentence mappings.
 * Each emotion has an array of possible string responses.
 */
const emotionResponses: Record<string, string[]> = {
  HAPPY: [
    "Hey, you seem to be in a great mood! Let's find some upbeat music.",
    "Someone's cheerful today! Let's keep that feeling going.",
    "That's a great smile! I've got the perfect happy playlist for you.",
    "You're looking pretty happy! Time for some feel-good tunes.",
    "Got that happy glow! Let's find a song to match."
  ],
  SAD: [
    "Looks like you're feeling a bit down. Maybe some gentle music can help?",
    "I'm sensing some sadness. It's okay, let's find a song for you.",
    "You seem a little blue. How about a comforting playlist?",
    "Hey, I'm here for you. Let's put on some music to suit your mood.",
    "Feeling a bit low? Let's find a song to see you through it."
  ],
  ANGRY: [
    "Whoa, sensing some strong feelings. Need some music to let off steam?",
    "You seem pretty angry. Let's find something powerful.",
    "Feeling intense right now? I've got some music that can match that energy.",
    "Looks like you're feeling heated. Let's channel that with some music.",
    "Okay, let's find a track to help you process that anger."
  ],
  SURPRISED: [
    "Oh! You look surprised. Let's find a song that's just as unexpected!",
    "Caught you off guard, huh? Let's find a playlist to match that surprise.",
    "Well, that's a surprised look! How about some exciting music?",
    "You look like you just saw something wild! Let's find a song.",
    "Surprise! Let's get some music playing."
  ],
  DISGUSTED: [
    "Yikes, you do not look pleased. How about some music to clear the air?",
    "Hmm, that's a look of disgust if I've ever seen one. Need a distraction?",
    "Not a fan of something, huh? Let's find a song to change the vibe.",
    "That look says 'yuck'. Let's find some 'yum' music.",
    "Okay, let's get your mind off... whatever that was. Music time."
  ],
  CALM: [
    "You seem very calm and relaxed. Let's find some chilled-out music.",
    "Feeling peaceful? I've got the perfect chill playlist for you.",
    "Nice and calm. Let's keep that zen-like state with some music.",
    "You're in a calm mood. Let's find some gentle, relaxing tunes.",
    "Looks like a good time to just chill. I'll get the music."
  ],
  NEUTRAL: [
    "Looking neutral. Let's find a playlist to set a new mood.",
    "Just a normal day, huh? Let's find some all-around good music.",
    "Feeling pretty neutral. What kind of vibe are you in the mood for?",
    "Alright, a blank canvas. Let's find some music.",
    "Okay, just vibing. Let's find a balanced playlist."
  ],
  DEFAULT: [
    "I can't quite read your mood... but I can always find a good song.",
    "Not sure what you're feeling, but music is always a good idea.",
    "Hmm, let's just find an awesome playlist for you.",
    "Let's just skip to the good part... music!",
    "Can't get a read, so let's just play a classic."
  ]
};

/**
 * Gets a random, friendly sentence based on the detected emotion.
 * @param emotion The emotion string (e.g., "HAPPY", "SAD")
 * @returns A randomly selected sentence string.
 */
export function getRandomEmotionSentence(emotion: string): string {
  const normalizedEmotion = emotion.toUpperCase();
  const responses = emotionResponses[normalizedEmotion] || emotionResponses['DEFAULT'];

  // Pick a random index from the array
  const randomIndex = Math.floor(Math.random() * responses.length);

  return responses[randomIndex];
}