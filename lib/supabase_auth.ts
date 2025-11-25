import { supabase } from "./supabase";

// Function to handle new user sign-up with email and password.
export const signUp = async (email: string, password: string) => {
  // Calls the Supabase auth `signUp` method to create a new user account.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
};

// Function to handle user sign-in with email and password.
export const signIn = async (email: string, password: string) => {
  // Calls the Supabase auth `signInWithPassword` method to authenticate the user.
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
};

// Function to sign out the currently authenticated user.
export const signOut = async () => {
  // Calls the Supabase auth `signOut` method to end the user's session.
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};

// Function to retrieve the current user's session data.
export const getSession = async () => {
  // Calls the Supabase auth `getSession` method to check for an active session.
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
};


// for notifying, The whole design is inspired by Aryan Bhanot's earlier work on the Tune Space music app.
// Here is the link to the original repository:

// https://github.com/aryanbhanot05/Tune_Space

// Thank You for reviewing my code!