import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, pin } = await req.json()

    if (!phone || !pin) {
      throw new Error('Phone and PIN are required')
    }

    // Init Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch User by Phone
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('*')
      .eq('phone_number', phone)
      .single()

    if (userError || !user) {
        console.error("Login Failed: User not found", phone);
        // Generic error for security
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
        })
    }

    // 2. Verify PIN
    // Note: In a real scenario, use bcrypt.compare(pin, user.pin_hash)
    // For this scaffolding, assuming hash is valid bcrypt hash.
    const isValid = await bcrypt.compare(pin, user.pin_hash);

    if (!isValid) {
        console.error("Login Failed: Invalid PIN");
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
        })
    }

    // 3. Success
    // We return the user object. The frontend can store this in context.
    // In strict auth, we might mint a custom JWT here using a library if we want to integrate with RLS.
    // For simplicity in this POS structure where Staff share a device, simply returning the user struct is often used for identifying the active "operator".
    
    // Remove sensitive data
    const { pin_hash, ...safeUser } = user;

    return new Response(
      JSON.stringify({ 
          user: safeUser,
          token: "mock-session-token-for-pos" 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
