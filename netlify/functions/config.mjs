export default async () => {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || "";
  if (!supabaseUrl || !supabasePublishableKey) {
    return new Response(JSON.stringify({ configured: false }), {
      status: 503,
      headers: { "content-type": "application/json", "cache-control": "no-store" }
    });
  }
  return new Response(JSON.stringify({
    configured: true,
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    supabasePublishableKey
  }), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
};
