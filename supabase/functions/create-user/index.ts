import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Note: SERVICE_ROLE_KEY is required to bypass auth checks and create users
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        )

        // 1. Verify the requester is a Director
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')

        const token = authHeader.replace('Bearer ', '')
        const { data: { user: requester }, error: requesterError } = await supabaseAdmin.auth.getUser(token)

        if (requesterError || !requester) {
            throw new Error('Neautorizovaný přístup')
        }

        // Role check logic matching our app
        const requesterRole = requester.app_metadata?.role || requester.user_metadata?.role
        if (requesterRole !== 'director') {
            throw new Error('Pouze ředitel může vytvářet uživatele')
        }

        // 2. Extract data from body
        const { email, password, role } = await req.json()

        if (!email || !password || !role) {
            throw new Error('Chybí email, heslo nebo role')
        }

        // Validate role
        const validRoles = ['evaluator-1', 'evaluator-2', 'evaluator-3', 'director']
        if (!validRoles.includes(role)) {
            throw new Error('Neplatná role')
        }

        // 3. Create the user via Admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            app_metadata: { role: role },
            user_metadata: { role: role } // Set in both just in case
        })

        if (createError) throw createError

        return new Response(JSON.stringify({
            success: true,
            message: 'Uživatel úspěšně vytvořen',
            user: { id: newUser.user.id, email: newUser.user.email }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
