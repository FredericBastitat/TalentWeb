
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Auth check
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: requester }, error: reqError } = await supabaseAdmin.auth.getUser(token)

        if (reqError || !requester || requester.app_metadata?.role !== 'director') {
            throw new Error('Pouze ředitel může spravovat uživatele')
        }

        const { action, userData } = await req.json()

        if (action === 'list') {
            const { data, error } = await supabaseAdmin.auth.admin.listUsers()
            if (error) throw error

            const users = data.users.map(u => ({
                id: u.id,
                email: u.email,
                role: u.app_metadata?.role ?? 'bez role'
            }))

            return new Response(JSON.stringify({ success: true, users }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (action === 'create') {
            const { email, password, role } = userData
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                app_metadata: { role },
                user_metadata: { role }
            })
            if (error) throw error
            return new Response(JSON.stringify({ success: true, user: data.user }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        throw new Error('Unknown action')

    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
