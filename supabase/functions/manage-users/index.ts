
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const createResponse = (body: any, status = 200) => {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
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

        // Auth check - only directors can manage users
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')

        const token = authHeader.replace('Bearer ', '')
        const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !requester || requester.app_metadata?.role !== 'director') {
            return createResponse({ success: false, error: 'Unauthorized: Pouze ředitel může spravovat uživatele' }, 401)
        }

        const { action, userData } = await req.json()

        switch (action) {
            case 'list': {
                const { data, error } = await supabaseAdmin.auth.admin.listUsers()
                if (error) throw error

                const users = data.users.map(u => ({
                    id: u.id,
                    email: u.email,
                    role: u.app_metadata?.role ?? 'bez role'
                }))

                return createResponse({ success: true, users })
            }

            case 'create': {
                const { email, password, role } = userData || {}
                if (!email || !password || !role) {
                    throw new Error('Chybí povinné údaje: email, heslo nebo role')
                }

                const { data, error } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    app_metadata: { role },
                    user_metadata: { role }
                })

                if (error) throw error
                return createResponse({ success: true, user: data.user })
            }

            case 'delete': {
                const { userId } = userData || {}
                if (!userId) throw new Error('Chybí ID uživatele k smazání')

                if (userId === requester.id) {
                    throw new Error('Nemůžete smazat svůj vlastní účet')
                }

                const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
                if (error) throw error

                return createResponse({ success: true })
            }

            default:
                throw new Error(`Neznámá akce: ${action}`)
        }

    } catch (err) {
        return createResponse({ success: false, error: err.message }, 400)
    }
})
