const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://quaertoxcdkzcyrebtyl.supabase.co'
const supabaseKey = process.env.SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;