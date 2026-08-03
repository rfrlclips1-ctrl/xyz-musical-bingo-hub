const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store" }
});

const cleanSlug = (value) => /^[a-z0-9-]{2,80}$/.test(String(value || "")) ? String(value) : "";
const textValue = (value, max = 300) => String(value || "").trim().slice(0, max);
const normalized = (value) => textValue(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

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
  if (!expectedKey || suppliedKey !== expectedKey) return json(401, { error: "Invalid bridge key." });

  try {
    const body = await request.json();
    const venueSlug = cleanSlug(body.venueSlug);
    const title = textValue(body.title);
    const artist = textValue(body.artist);
    const album = textValue(body.album);
    const artworkUrl = textValue(body.artworkUrl, 1000);
    const detectedAt = body.detectedAt && !Number.isNaN(Date.parse(body.detectedAt)) ? new Date(body.detectedAt).toISOString() : new Date().toISOString();
    if (!venueSlug || !title) return json(400, { error: "venueSlug and title are required." });

    const sessions = await supabase(`sessions?select=id,round_slug&venue_slug=eq.${encodeURIComponent(venueSlug)}&status=eq.active&order=started_at.desc&limit=1`, { method: "GET" });
    const session = sessions?.[0];
    if (!session) return json(202, { published: false, waiting: true, message: "No active session for this venue." });

    const lastRows = await supabase(`tracks?select=position,title,artist&session_id=eq.${encodeURIComponent(session.id)}&order=position.desc&limit=1`, { method: "GET" });
    const last = lastRows?.[0];
    if (last && normalized(last.title) === normalized(title) && normalized(last.artist) === normalized(artist)) {
      return json(200, { published: false, duplicate: true, position: last.position });
    }

    const position = Number(last?.position || 0) + 1;
    const inserted = await supabase("tracks", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        session_id: session.id,
        position,
        title,
        artist,
        album,
        artwork_url: artworkUrl || null,
        detected_at: detectedAt
      })
    });
    return json(200, { published: true, position, track: inserted?.[0] || null, roundSlug: session.round_slug });
  } catch (error) {
    return json(500, { error: error.message || "Track publish failed." });
  }
};
