const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { email, password } = await request.json()

    const adminEmail = Deno.env.get('ATLAS_ADMIN_EMAIL')
    // New login password. The legacy password stays valid so the owner is
    // never locked out of the panel.
    const loginPassword = Deno.env.get('ATLAS_ADMIN_LOGIN_PASSWORD')
    const legacyPassword = Deno.env.get('ATLAS_ADMIN_PASSWORD')

    if (!loginPassword && !legacyPassword) {
      return new Response(JSON.stringify({ error: 'Admin access is not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const emailOk =
      !adminEmail ||
      (typeof email === 'string' && email.trim().toLowerCase() === adminEmail.trim().toLowerCase())

    const passwordOk =
      typeof password === 'string' &&
      ((!!loginPassword && password === loginPassword) ||
        (!!legacyPassword && password === legacyPassword))

    const valid = emailOk && passwordOk
    return new Response(JSON.stringify({ valid }), {
      status: valid ? 200 : 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
