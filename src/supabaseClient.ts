/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY harus diatur di environment variable!");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
