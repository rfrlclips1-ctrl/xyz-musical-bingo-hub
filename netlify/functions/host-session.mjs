const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store" }
});

const cleanSlug = (value) => /^[a-z0-9-]{2,80}$/.test(String(value || "")) ? String(value) : "";

const supabase = async (path, options = {}) => {
  const base = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const secret = process.env.SUPABASE_SECRET_KEY || "";
  if (!base || !secret) throw new Error("Supabase environment variables are missing.");
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Supabase request failed (${response.status})`);
  return text ? JSON.parse(text) : null;
};

export default async (request) => {
  if (request.method !== "POST") return json(405, { error: "POST required." });
  const expectedKey = process.env.HOST_BRIDGE_KEY || "";
  const suppliedKey = request.headers.get("x-host-key") || "";
  if (!expectedKey || suppliedKey !== expectedKey) return json(401, { error: "Invalid host key." });

  try {
    const body = await request.json();
    const action = String(body.action || "");
    const venueSlug = cleanSlug(body.venueSlug);
    const roundSlug = cleanSlug(body.roundSlug);
    if (!venueSlug || !roundSlug) return json(400, { error: "Valid venueSlug and roundSlug are required." });
    const now = new Date().toISOString();

    if (action === "start") {
      await supabase(`sessions?venue_slug=eq.${encodeURIComponent(venueSlug)}&status=eq.active`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "ended", ended_at: now })
      });
      const created = await supabase("sessions", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ venue_slug: venueSlug, round_slug: roundSlug, status: "active", started_at: now })
      });
      return json(200, { active: true, session: created?.[0] || null, message: `Started ${roundSlug} at ${venueSlug}.` });
    }

    const active = await supabase(`sessions?select=id,round_slug&venue_slug=eq.${encodeURIComponent(venueSlug)}&round_slug=eq.${encodeURIComponent(roundSlug)}&status=eq.active&order=started_at.desc&limit=1`, { method: "GET" });
    const session = active?.[0];

    if (action === "end") {
      if (!session) return json(200, { active: false, message: "No matching active session was found." });
      await supabase(`sessions?id=eq.${encodeURIComponent(session.id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "ended", ended_at: now })
      });
      return json(200, { active: false, message: "Session ended." });
    }

    if (action === "clear") {
      if (!session) return json(200, { active: false, message: "No matching active session was found." });
      await supabase(`tracks?session_id=eq.${encodeURIComponent(session.id)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
      });
      return json(200, { active: true, message: "Song history cleared." });
    }

    return json(400, { error: "Unknown action." });
  } catch (error) {
    return json(500, { error: error.message || "Host action failed." });
  }
};
