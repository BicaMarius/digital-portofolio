import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxjixdiihymvlclxmxku.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aml4ZGlpaHltdmxjbHhteGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzA4NzgsImV4cCI6MjA3MzcwNjg3OH0.3LjL6W_swKceJkLkksLXoAn4S2ivjt3ypMOvMe0A5o4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
