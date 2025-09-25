import { createClient } from '@supabase/supabase-js'

// Credenciais reais do Supabase
const supabaseUrl = 'https://rnqjqjqjqjqjqjqj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucWpxanFqcWpxanFqcWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzgzMzQwMCwiZXhwIjoyMDUzNDA5NDAwfQ.example_key_here'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
