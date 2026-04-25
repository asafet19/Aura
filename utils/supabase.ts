import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://becsewrnnzhzdqnbjhrs.supabase.co';
// PASTE YOUR ANON KEY (the one starting with eyJ) BELOW
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlY3Nld3JubnpoemRxbmJqaHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTgzODMsImV4cCI6MjA5MjYzNDM4M30.8lbvd7CTMCgTSh-HcTyvdK2yPImoO65Znv5-IoMvkKE'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);