import { supabase } from './supabase';

// Defines the structure for user details.
export interface UserDetails {
    uuid: string;
    first_name: string;
    last_name: string;
    email: string;
};

// Fetches all user details from the 'user_details' table.
export async function getUsers() {
    const { data, error } = await supabase
        .from('user_details')
        .select('*');

    if (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
    return data;
}

// Fetches a single user's details by their UUID.
export async function getUserById(uuid: string) {
    const { data, error } = await supabase
        .from('user_details')
        .select('*')
        .eq('uuid', uuid)
        .single();

    if (error) {
        console.error(`Error fetching user with ID ${uuid}:`, error);
        throw error;
    }
    return data;
}

// Creates a new user entry in the 'user_details' table.
export async function createUser(user: UserDetails) {
    const { data, error } = await supabase
        .from('user_details')
        .insert([user]);

    if (error) {    
        console.error("Error creating user:", error);
        throw error;
    }
    return data;
}

// Updates an existing user's details by their UUID.
export async function updateUser(uuid: string, updates: { first_name: string; last_name: string; email: string }) {
    const { data, error } = await supabase
        .from('user_details')
        .update(updates)
        .eq('uuid', uuid);

    if (error) {
        console.error(`Error updating item with ID ${uuid}:`, error);
        throw error;
    }
    return data;
}

// Deletes a user entry from the 'user_details' table by their UUID.
export async function deleteUser(uuid: string) {
    const { data, error } = await supabase
        .from('user_details')
        .delete()
        .eq('uuid', uuid);

    if (error) {
        console.error(`Error deleting item with ID ${uuid}:`, error);
        throw error;
    }
    return data;
}