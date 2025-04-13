import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fkdkpkeumzylpwzcxtka.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrZGtwa2V1bXp5bHB3emN4dGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzNjczODgsImV4cCI6MjA1ODk0MzM4OH0.ESArEJEQVBJBKpw9yFBAL5ed-tRiJv37NZSCUOFbiBc";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anon Key must be provided in environment variables (REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
