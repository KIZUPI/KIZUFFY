import { createClient } from '@supabase/supabase-js';
import type { Letter } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Auth Helpers ──────────────────────────────────────────────

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname,
    },
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ── Letter CRUD ───────────────────────────────────────────────

export interface LetterRow {
  id: string;
  user_id: string | null;
  title: string;
  recipient: string;
  sender: string;
  body: string;
  theme: string;
  is_anonymous: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

function rowToLetter(row: LetterRow): Letter {
  const date = new Date(row.created_at);
  return {
    id: row.id,
    title: row.title,
    recipient: row.recipient,
    sender: row.sender,
    body: row.body,
    theme: row.theme as Letter['theme'],
    createdAt: date.toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
    userId: row.user_id,
  };
}

export async function createLetter(data: {
  title: string;
  recipient: string;
  sender: string;
  body: string;
  theme: string;
}): Promise<Letter> {
  const { data: letter, error } = await supabase
    .from('letters')
    .insert({
      title: data.title,
      recipient: data.recipient,
      sender: data.sender,
      body: data.body,
      theme: data.theme,
      user_id: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToLetter(letter as LetterRow);
}

/**
 * Creates an anonymous letter — no auth required.
 * Stores in Supabase with user_id = NULL, is_anonymous = TRUE.
 * Returns a short UUID-based letter that can be shared via #/letter/<uuid>
 */
export async function createAnonymousLetter(data: {
  title: string;
  recipient: string;
  sender: string;
  body: string;
  theme: string;
}): Promise<Letter> {
  const { data: letter, error } = await supabase
    .from('letters')
    .insert({
      title: data.title,
      recipient: data.recipient,
      sender: data.sender,
      body: data.body,
      theme: data.theme,
      user_id: null,
      is_anonymous: true,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToLetter(letter as LetterRow);
}

export async function getLetterById(id: string): Promise<Letter | null> {
  const { data, error } = await supabase
    .from('letters')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }
  return rowToLetter(data as LetterRow);
}

export async function getUserLetters(userId: string): Promise<Letter[]> {
  const { data, error } = await supabase
    .from('letters')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as LetterRow[]).map(rowToLetter);
}

export async function deleteLetter(id: string): Promise<void> {
  const { error } = await supabase
    .from('letters')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
