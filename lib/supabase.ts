// Imports the necessary function to create a Supabase client.
import { createClient } from '@supabase/supabase-js';

// Retrieves the Supabase project variables from a public environment variable (i.e. .env file).
const url_key = process.env.EXPO_PUBLIC_URL || '';
const anon_key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Initializes and exports the Supabase client instance to interact with your database
export const supabase = createClient(url_key, anon_key);



// for notifying, The whole design is inspired by Aryan Bhanot's earlier work on the Tune Space music app.
// Here is the link to the original repository:

// https://github.com/aryanbhanot05/Tune_Space

// Thank You for reviewing my code!