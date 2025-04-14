
console.log('SUPABASE_URL:', import.meta.env.SUPABASE_URL);
console.log('SUPABASE_KEY:', import.meta.env.SUPABASE_KEY?.slice(0, 10) + '...');

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
