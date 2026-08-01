import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uwylrlozznbvrobbtbhq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3eWxybG96em5idnJvYmJ0YmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0ODQyMjcsImV4cCI6MjEwMTA2MDIyN30.hRhjCEfH1N-g6-Jul09wyR9hnG6TMrm46bN1A6JMBV8";
export const supabase = createClient(supabaseUrl, supabaseKey);
