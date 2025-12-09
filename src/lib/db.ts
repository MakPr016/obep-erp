import { createClient } from "@/lib/supabase/server"

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const supabase = await createClient()
  
  // Use Supabase's rpc or direct query
  // For now, we'll use the .from() methods
  // If you need raw SQL, you'll need to create RPC functions in Supabase
  
  throw new Error("Use Supabase client methods instead of raw SQL")
}

export async function getSupabaseClient() {
  return await createClient()
}
