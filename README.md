# CRM Nelore VC

CRM de gestão de leads, vendas, contratos e catálogo para o criatório Nelore VC
(Jv Assessoria Pecuária). Aplicação React + Vite servida como SPA, com Supabase
(Postgres, Auth, Storage, Edge Functions) como backend.

## Stack

| Camada | Tecnologia |
| --- | --- |
| UI | React 18, TypeScript, Vite 5, Tailwind CSS, shadcn/ui (Radix) |
| Estado/dados | TanStack Query, Supabase JS v2 |
| Backend | Supabase — Postgres 17, Auth, Storage, Edge Functions (Deno) |
| Migrations | SQL em `supabase/migrations/` (Supabase CLI) e `drizzle/migrations/` |
| Testes | Vitest + Testing Library |

## Configuração

### 1. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha com os dados do seu projeto Supabase (Project Settings → Data API e API Keys):

| Variável | Para quê |
| --- | --- |
| `VITE_SUPABASE_URL` | Endpoint da API do projeto |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publicável (anon) usada no browser |
| `VITE_SUPABASE_PROJECT_ID` | Ref do projeto |
| `VITE_PUBLIC_SITE_URL` | Domínio público usado em links de contrato, formulários e página comercial. Vazio = origem atual do navegador |

O app falha na inicialização com mensagem explícita se `VITE_SUPABASE_URL` ou
`VITE_SUPABASE_PUBLISHABLE_KEY` estiverem ausentes.

### 2. Rodar localmente

```bash
npm install
npm run dev          # http://localhost:8080
```

Outros comandos:

```bash
npm run build        # build de produção em dist/
npm run preview      # serve o build
npm run lint         # ESLint
npm test             # Vitest
```

## Deploy

O projeto é uma SPA: `npm run build` gera estáticos em `dist/`, que rodam em
qualquer host de site estático. Já vão no repositório as configs de SPA
fallback (`vercel.json`, `netlify.toml`, `public/_redirects`) — sem elas, abrir
`/catalogo/:id` ou `/contrato/:token` direto na URL devolve 404, porque quem
resolve essas rotas é o React Router, no cliente.

**As variáveis `VITE_*` precisam ser cadastradas no painel do host.** O `.env`
é ignorado pelo git de propósito, então o build no servidor não o enxerga; sem
as variáveis, o app aborta na inicialização com erro explícito.

### Cloudflare Workers (configurado neste repositório)

O `wrangler.jsonc` já está pronto: serve `dist/` como Workers Static Assets com
`not_found_handling: single-page-application`.

```bash
npx wrangler login     # abre o navegador, uma única vez
npm run deploy         # build + deploy; imprime a URL ao final
```

**Domínio próprio já configurado.** O `wrangler.jsonc` traz `nelorevc.com` e
`www.nelorevc.com` como Custom Domains. No primeiro deploy o wrangler cria os
registros DNS e emite o certificado sozinho — a zona já está no Cloudflare e o
apex não tinha registro A nem CNAME, então nada é sobrescrito.

Além do domínio, o worker continua acessível em
`https://crm-nelore-vc.<sua-conta>.workers.dev`.

Para usar outro domínio, troque os `routes` no `wrangler.jsonc` e ajuste
`VITE_PUBLIC_SITE_URL` no `.env` — é ela que monta os links de contrato,
formulário e página comercial.

Em CI (sem navegador), use um API token no lugar do `login`:

```bash
CLOUDFLARE_API_TOKEN=... npx wrangler deploy
```

#### Workers Builds (deploy automático a cada push)

Conectando o repositório em Workers & Pages → Create → Connect to Git, a
Cloudflare builda e publica sozinha. Três campos precisam estar certos, e o
padrão do painel erra nos três:

| Campo | Valor correto | O que acontece se ficar errado |
| --- | --- | --- |
| Comando da build | `npm run build` | Vazio, `dist/` nunca é criado e o wrangler falha com *"The directory specified by the `assets.directory` field does not exist"* |
| Comando de implantação | `npx wrangler deploy` | `wrangler versions upload` só sobe uma versão **sem ativar** — o site não entra no ar e o Custom Domain não é criado |
| Variáveis de ambiente | as `VITE_*` da tabela de configuração | **O build passa mesmo assim** e o deploy é reportado como sucesso, mas o app aborta no navegador com "Supabase não configurado" |

O terceiro é o mais traiçoeiro: as `VITE_*` são lidas em tempo de build, e a
ausência delas não quebra o `vite build` — quebra só quando a página abre. Um
build verde não garante um site funcionando.

Alternativa em um campo só: deixe o comando de build vazio e ponha
`npm run deploy` como comando de implantação — o script já faz
`npm run build && wrangler deploy`.

Se o deploy passar mas o domínio continuar sem responder, verifique as
permissões do token gerado pelo Workers Builds: criar Custom Domain exige
`Zone:DNS:Edit` na zona, além de `Workers Scripts:Edit`.

### Outros hosts

| Host | Como publicar |
| --- | --- |
| Vercel | `npx vercel --prod` |
| Netlify | `npx netlify deploy --prod` |

**Atenção com as variáveis:** as `VITE_*` são embutidas no bundle **no momento
do build**. Rodando `npm run deploy` da sua máquina, o `.env` local é usado; se
o build rodar no servidor (Workers Builds, CI), cadastre-as lá.

Depois de publicar, aponte `VITE_PUBLIC_SITE_URL` para o domínio final — é ele
que monta os links de contrato, formulário público e página comercial.

## Banco de dados

O schema vive em `supabase/migrations/`, aplicado em ordem cronológica pelo nome
do arquivo. Com a [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <seu-project-ref>
supabase db push
```

São 27 tabelas em `public`, todas com Row Level Security ativo. O controle de
acesso gira em torno de dois papéis (enum `app_role`):

- **coordenador** — acesso total: equipe, funis, catálogo, contratos, integração Meta, página comercial.
- **vendedor** — enxerga apenas os próprios leads (`responsavel_id`) e vendas (`vendedor_id`).

As policies usam `private.has_role()` e `private.has_lead_access()`, funções
`SECURITY DEFINER` no schema `private`, que não é exposto via PostgREST.

### Primeiro acesso

As migrations de seed criam a conta de coordenador. A senha vem da configuração
`app.seed_admin_password`; se não for definida, uma senha aleatória é gerada e o
acesso precisa ser feito pelo fluxo de "esqueci minha senha". Para definir uma
senha conhecida ao aplicar as migrations num banco novo:

```sql
SET app.seed_admin_password = 'sua-senha-forte';
```

Nenhuma senha é versionada neste repositório.

### Buckets de Storage

| Bucket | Público | Conteúdo |
| --- | --- | --- |
| `lead-documentos` | não | Documentos anexados aos leads |
| `animais-fotos` | sim | Fotos do catálogo de animais |
| `pagina-comercial-midia` | sim | Imagens e vídeos da página comercial |
| `contratos-pdf` | não | PDFs dos contratos gerados |

## Edge Functions

Em `supabase/functions/`. Deploy com `supabase functions deploy <nome>`.

| Função | JWT | O que faz |
| --- | --- | --- |
| `criar-membro` | sim | Cria usuário da equipe (coordenador) |
| `excluir-membro` | sim | Remove usuário da equipe (coordenador) |
| `contrato-publico` | não | Lê contrato pelo token público |
| `assinar-contrato` | não | Registra assinatura eletrônica (nome, CPF, IP, hash) |
| `submeter-formulario` | sim | Recebe formulário público e cria lead |
| `pagina-comercial-lead` | sim | Recebe lead da página comercial |
| `receber-proposta` | sim | Recebe proposta do catálogo e cria lead |
| `extrair-frame-video` | sim | Extrai frames de vídeo do YouTube para o catálogo |
| `meta-lead-webhook` | não* | Webhook do Meta Lead Ads |
| `meta-listar-forms` | sim | Lista formulários de Lead Ads das páginas conectadas |
| `meta-testar-conexao` | sim | Valida o token da Meta e lista páginas |
| `meta-reprocessar-evento` | sim | Reprocessa um evento do log da Meta |

`_shared/meta-processar.ts` é o módulo comum do pipeline de leads da Meta.

\* `meta-lead-webhook` não exige JWT porque a Meta não emite um. No lugar disso,
a função valida o header `X-Hub-Signature-256` (HMAC-SHA256 do corpo bruto com o
App Secret) em comparação de tempo constante. **A verificação falha fechada**:
sem `META_APP_SECRET` configurado, nenhuma entrega é aceita — sem isso qualquer
pessoa que descobrisse a URL poderia injetar leads falsos no CRM.

As outras funções públicas (`contrato-publico`, `assinar-contrato`) são
protegidas pelo `token_publico` do contrato — um UUID v4, inviável de adivinhar —
e as demais exigem JWT válido, checando papel de coordenador quando aplicável.

### Secrets das Edge Functions

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são injetadas
automaticamente pelo Supabase. As da Meta precisam ser cadastradas em
Supabase → Edge Functions → Secrets:

| Secret | Necessária para |
| --- | --- |
| `META_PAGE_ACCESS_TOKEN` | Buscar leads e formulários na Graph API |
| `META_VERIFY_TOKEN` | Handshake de verificação do webhook do Meta |
| `META_APP_SECRET` | **Validar a assinatura das entregas do webhook** |

`META_APP_SECRET` é o App Secret do app na Meta (Configurações → Básico). Sem
ela o webhook recusa toda entrega com 503, por segurança.

Sem essas secrets a integração com Meta Ads fica inativa — o resto do CRM
funciona normalmente.

## Estrutura

```
src/
  pages/              Rotas (Funis, Vendas, Contratos, Catálogo, Admin…)
  components/         Componentes por domínio + ui/ (shadcn)
  hooks/              Hooks de dados sobre TanStack Query
  integrations/       Client e tipos gerados do Supabase
  lib/                Utilitários (URLs públicas, formatação)
supabase/
  migrations/         Schema versionado
  functions/          Edge Functions (Deno)
drizzle/              Migrations complementares de hardening de RLS
```

Os tipos em `src/integrations/supabase/types.ts` são gerados do banco:

```bash
supabase gen types typescript --project-id <seu-project-ref> > src/integrations/supabase/types.ts
```
