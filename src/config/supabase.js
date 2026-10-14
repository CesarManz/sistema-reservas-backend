import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Advertencia: SUPABASE_URL o SUPABASE_KEY no están definidos en las variables de entorno.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
