/**
 * Authentication and User Helpers
 * Server-side utilities for getting user data and roles
 */

import { createClient } from '@/lib/supabase/server'
import { Profile } from '@/lib/types/database'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Note: We don't check email_confirmed_at here because
  // email confirmation should be disabled in Supabase settings
  // If you're getting "email not confirmed" errors, run migration 007_fix_email_confirmation.sql

  return user
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return null
  }

  return profile
}

export async function getUserRole(): Promise<'admin' | 'teacher' | 'student' | null> {
  const profile = await getCurrentProfile()
  return profile?.role || null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireRole(role: 'admin' | 'teacher' | 'student') {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== role) {
    throw new Error(`Unauthorized: Requires ${role} role`)
  }
  return profile
}
