const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const encoder = new TextEncoder()

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function createAdminToken(secret: string) {
  const expiresAt = Date.now() + 12 * 60 * 60 * 1000
  const payload = `atlas-admin:${expiresAt}`
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return `${payload}.${toHex(signature)}`
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
    const adminToken = valid
      ? await createAdminToken(loginPassword || legacyPassword || '')
      : undefined
    return new Response(JSON.stringify({ valid, adminToken }), {
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
