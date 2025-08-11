import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iryueqfyscbdtgutzqnq.supabase.co'
const supabaseKey = process.env.SERVICE_KEY
 export const supabase = createClient(supabaseUrl, supabaseKey)