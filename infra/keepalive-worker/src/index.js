export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(ping(env));
  },

  async fetch(_req, env) {
    const result = await ping(env);
    return new Response(JSON.stringify(result), {
      headers: { 'content-type': 'application/json' },
      status: result.ok ? 200 : 502,
    });
  },
};

async function ping(env) {
  const url = `${env.SUPABASE_URL}/rest/v1/teams?select=id&limit=1`;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      },
    });
    const elapsed = Date.now() - started;
    console.log(`keepalive ${res.status} in ${elapsed}ms`);
    return { ok: res.ok, status: res.status, elapsed_ms: elapsed };
  } catch (err) {
    console.error(`keepalive error: ${err.message}`);
    return { ok: false, error: err.message };
  }
}
