// Imports the necessary function to create a Supabase client.
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Retrieves the Supabase project variables from a public environment variable (i.e. .env file).
// NOTE: Expo convention uses EXPO_PUBLIC_SUPABASE_URL (not EXPO_PUBLIC_URL).
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';


// Initializes and exports the Supabase client instance to interact with your database.
// Extra options: persist sessions across app restarts, auto-refresh tokens,
// and detect OAuth sessions in URL when running on web.
const isWeb = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: isWeb,
  },
});

// for notifying, The whole design is inspired by Aryan Bhanot's earlier work on the Tune Space music app.
// Here is the link to the original repository:
//
// https://github.com/aryanbhanot05/Tune_Space
//
// Thank You for reviewing my code!
