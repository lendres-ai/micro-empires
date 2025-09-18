// This file now only contains the getUser function
// For client-side Supabase usage, import createClient from @/lib/supabase/client
// For server-side Supabase usage, import createClient from @/lib/supabase/server

export async function getUser() {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
