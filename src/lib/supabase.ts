import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Allow working in offline or preview states but note in console.
  console.warn('[Atlas] Missing Supabase env vars. Using fallback client (all remote calls will fail).')
}

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'public-anon-key-placeholder'
)

// Helper types for our schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Location {
  id: string
  created_at: string
  lat: number
  lng: number
  category: string[]
  contact_phone?: string | null
  contact_web?: string | null
  contact_other?: Json | null
  name: Json // multi-lang {en, ru, fr, ar}
  description: Json
  country?: string | null
  city?: string | null
  verified: boolean
  source_note?: string | null
}

export interface CaseStory {
  id: string
  created_at: string
  published: boolean
  title: Json
  situation: Json
  actions: Json
  outcome: Json
  lang_primary?: string | null
  tags?: string[] | null
}

export interface LocationSuggestion {
  id: string
  created_at: string
  lat: number
  lng: number
  proposed_name: Json
  category: string[]
  contact_phone?: string
  contact_web?: string
  message?: string
  reviewed: boolean
  review_note?: string
}

export interface CaseSubmission {
  id: string
  created_at: string
  title: Json
  situation: Json
  actions?: Json
  outcome?: Json
  notes?: string
  reviewed: boolean
  actioned_case_id?: string
}
