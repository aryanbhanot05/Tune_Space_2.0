import { createClient } from '@supabase/supabase-js';

const url_key = process.env.EXPO_PUBLIC_URL;
const anon_key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(url_key, anon_key);