# Carteira 2040

Painel de acompanhamento da carteira de FIIs + Tesouro IPCA+ 2040, com login
e sincronização pela nuvem. Roda como site estático (GitHub Pages).

## 1. Supabase

1. Crie um projeto grátis em https://supabase.com
2. **SQL Editor** → cole e rode o `supabase-schema.sql`.
3. **Settings → API** → copie a `Project URL` e a `anon public key`.
4. Cole as duas no topo do `index.html`, em `SUPABASE_URL` e `SUPABASE_ANON`.
5. **Authentication → URL Configuration** → `Site URL` = a URL do seu GitHub
   Pages. Adicione a mesma URL em `Redirect URLs`. Sem isso o link de acesso
   devolve o usuário para `localhost`.

Deixando as duas constantes em branco, o painel roda só no navegador, sem login.

## 2. Cotações (opcional, mas recomendado com mais de um usuário)

Assim um token só da brapi atende todo mundo, com cache de 30 minutos.

```bash
npm i -g supabase
supabase login
supabase link --project-ref SEU_REF
supabase secrets set BRAPI_TOKEN=seu_token_da_brapi
supabase functions deploy cotacoes
```

Sem a função, apague o valor de `FN_COTACOES` no `index.html` — aí cada pessoa
cola o próprio token da brapi em Ajustes.

## 3. GitHub Pages

Suba `index.html` na raiz do repo → Settings → Pages → branch `main`, pasta `/`.

## Segurança

- A `anon key` é pública por design. Quem protege os dados é a RLS.
- **Nunca** coloque a `service_role key` no `index.html`.
- Cada usuário só enxerga a própria linha da tabela `carteiras`.

## Dados

Gravados no Supabase e espelhados no `localStorage` como cache offline.
O botão "Baixar backup" continua valendo como segunda rede.
