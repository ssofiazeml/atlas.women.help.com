import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)))
}

async function isValidAdminToken(token: unknown, secret: string) {
  if (typeof token !== 'string') return false
  const separator = token.lastIndexOf('.')
  if (separator < 1) return false
  const payload = token.slice(0, separator)
  const signature = token.slice(separator + 1)
  if ((await sign(payload, secret)) !== signature) return false

  const [purpose, expiresAt] = payload.split(':')
  return purpose === 'atlas-admin' && Number(expiresAt) > Date.now()
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    const secret = Deno.env.get('ATLAS_ADMIN_LOGIN_PASSWORD') || Deno.env.get('ATLAS_ADMIN_PASSWORD')
    if (!secret || !(await isValidAdminToken(body.adminToken, secret))) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !serviceKey) throw new Error('Backend is not configured')
    const client = createClient(url, serviceKey)

    if (body.action === 'bootstrap') {
      const entries = Array.isArray(body.entries) ? body.entries : []
      const validEntries = entries
        .filter((entry: unknown) => {
          if (!entry || typeof entry !== 'object') return false
          const candidate = entry as { key?: unknown }
          return typeof candidate.key === 'string' && candidate.key.startsWith('atlas:')
        })
        .map((entry: { key: string; value: unknown }) => ({ key: entry.key, value: entry.value }))

      if (validEntries.length > 0) {
        const { error } = await client.from('site_content').upsert(validEntries, {
          onConflict: 'key',
          ignoreDuplicates: true,
        })
        if (error) throw error
      }

      const { data, error } = await client.from('site_content').select('key,value')
      if (error) throw error
      return new Response(JSON.stringify({ entries: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (body.action === 'save' && typeof body.key === 'string' && body.key.startsWith('atlas:')) {
      const { error } = await client
        .from('site_content')
        .upsert({ key: body.key, value: body.value }, { onConflict: 'key' })
      if (error) throw error
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('site-content error', error)
    return new Response(JSON.stringify({ error: 'Unable to save content' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})