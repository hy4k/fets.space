
import { createClient } from '@supabase/supabase-js';

// Directly use provided credentials to fix environment variable loading issues
const supabaseUrl = 'https://kficssolyisysccmkbkw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmaWNzc29seWlzeXNjY21rYmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MjE5MDMsImV4cCI6MjA3NzI5NzkwM30.iPyw_JwsgBVX2CuUrON429Wtz6-wsMvoz8n02J8vBS0';

export const supabase = createClient(supabaseUrl, supabaseKey);
