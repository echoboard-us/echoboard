import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = 'https://fkdkpkeumzylpwzcxtka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrZGtwa2V1bXp5bHB3emN4dGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzNjczODgsImV4cCI6MjA1ODk0MzM4OH0.ESArEJEQVBJBKpw9yFBAL5ed-tRiJv37NZSCUOFbiBc';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 