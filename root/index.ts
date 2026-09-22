// Carteira 2040 — Edge Function de cotações
// Guarda UM token da brapi no servidor e serve os dois usuários,
// com cache de 30 minutos para economizar requisição.
//
// Deploy:
//   supabase functions deploy cotacoes
//   supabase secrets set BRAPI_TOKEN=seu_token_aqui

const TOKEN = Deno.env.get("BRAPI_TOKEN") ?? "";
const CACHE = new Map<string, { em: number; preco: number }>();
const VALIDADE = 30 * 60 * 1000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Content-Type": "application/json",
};

async function brapi(tickers: string) {
  const r = await fetch(`https://brapi.dev/api/quote/${tickers}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const corpo = await r.json().catch(() => null);
  if (!r.ok) {
    const msg = corpo?.message || corpo?.error || `status ${r.status}`;
    throw new Error(msg);
  }
  return corpo?.results ?? [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { tickers } = await req.json();
    if (!Array.isArray(tickers) || !tickers.length) {
      return new Response(JSON.stringify({ error: "tickers ausentes" }), { status: 400, headers: cors });
    }

    const agora = Date.now();
    const precos: Record<string, number> = {};
    const buscar: string[] = [];

    for (const t of tickers) {
      const c = CACHE.get(t);
      if (c && agora - c.em < VALIDADE) precos[t] = c.preco;
      else buscar.push(t);
    }

    const falhas: string[] = [];
    if (buscar.length) {
      let results: any[] = [];
      try {
        results = await brapi(buscar.join(","));
      } catch (_e) {
        // um ticker ruim derruba o lote — tenta um a um
        for (const t of buscar) {
          try { results.push(...(await brapi(t))); }
          catch { falhas.push(t); }
        }
      }
      for (const q of results) {
        const p = Number(q.regularMarketPrice);
        if (q.symbol && isFinite(p) && p > 0) {
          precos[q.symbol] = Math.round(p * 100) / 100;
          CACHE.set(q.symbol, { em: agora, preco: precos[q.symbol] });
        }
      }
    }

    return new Response(JSON.stringify({ precos, falhas }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: cors });
  }
});
