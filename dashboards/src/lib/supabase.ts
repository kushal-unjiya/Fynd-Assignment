import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Use environment variables for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client for use on the server-side.
 * Using service role key if available for administrative tasks.
 */
export const createServerClient = () => {
    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
        },
    });
};

/**
 * Creates a Supabase client for use on the client-side.
 * Always uses the anon key.
 */
export const createBrowserClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
};
