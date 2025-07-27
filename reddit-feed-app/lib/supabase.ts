// reddit-feed-app/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fbsttzklesfpefbuhxlv.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic3R0emtsZXNmcGVmYnVoeGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2Mjk4NzcsImV4cCI6MjA2OTIwNTg3N30.t52YaKkRYuGMnlpv5vLiMUvF_-3LnM1bhh-Zcq3gvrc'; // Replace with your anon public key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);