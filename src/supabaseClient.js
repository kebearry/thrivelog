import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || process.env.SUPABASE_URL || 'https://fqyfrmufdvevbugtujib.supabase.co';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_Yll3S3MPbLm-gQDLfgPlAw_Ftccskw1';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
