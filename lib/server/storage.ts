import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { AppDatabase } from '@/lib/types';

const DATA_PATH = path.join(process.cwd(), 'data', 'db.json');
const TEMPLATE_PATH = path.join(process.cwd(), 'data', 'db.template.json');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_TABLE = process.env.SUPABASE_STATE_TABLE || 'app_state';

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensureDbFile() {
  try {
    await fs.access(DATA_PATH);
  } catch {
    const template = await fs.readFile(TEMPLATE_PATH, 'utf8');
    await fs.writeFile(DATA_PATH, template, 'utf8');
  }
}

export async function readRawDb<T extends AppDatabase>(fallback: T): Promise<T> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE)
      .select('data')
      .eq('id', 1)
      .single();

    if (!error && data?.data) {
      return data.data as T;
    }

    if (error && !String(error.message).toLowerCase().includes('no rows')) {
      throw new Error(`Supabase okuma hatası: ${error.message}`);
    }
  }

  await ensureDbFile();
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw || JSON.stringify(fallback)) as T;
}

export async function writeRawDb(db: AppDatabase) {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { error } = await supabase
      .from(SUPABASE_TABLE)
      .upsert({ id: 1, data: db, updated_at: new Date().toISOString() });

    if (error) {
      throw new Error(`Supabase yazma hatası: ${error.message}`);
    }
    return;
  }

  await fs.writeFile(DATA_PATH, JSON.stringify(db, null, 2), 'utf8');
}

export function storageMode() {
  return getSupabaseClient() ? 'supabase' : 'json-file';
}
