import { createClient } from '@supabase/supabase-js';

let SUPABASE_URL = 'YOUR_SUPABASE_URL';
let SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

try {
    const config = await import('../config.js');
    if (config.SUPABASE_CONFIG) {
        SUPABASE_URL = config.SUPABASE_CONFIG.url;
        SUPABASE_ANON_KEY = config.SUPABASE_CONFIG.anonKey;
    }
} catch (e) {
    console.warn('Supabase credentials not found in config.js. Using defaults.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
