# Produção — Nelore VC

- Aplicação: https://nelorevc.com
- Worker: crm-nelore-vc; conta Cloudflare 6c61e20cfff8cb3f6556857e0916225a.
- Supabase: rxmbgztsmydqqgceybnc (Jv Assessoria Project).
- O código parte da branch claude/clever-clarke-m9pnhu e incorpora as alterações do ZIP crmvc.zip.
- Comando de validação e build: npm run check.
- Deploy de produção: npx wrangler deploy, acionado pela branch main.
- Outras branches: npx wrangler versions upload (somente versão, sem ativar produção).
- Recuperação de senha: https://nelorevc.com/redefinir-senha e https://www.nelorevc.com/redefinir-senha.

## Configuração pública

O arquivo .env.production contém somente URL, identificador do projeto e chave
anon pública. Essa chave JWT é mantida para compatibilidade com as Edge Functions
públicas que já exigem JWT. Nunca adicionar service_role, senha ou token privado
em variáveis VITE_. O acesso aos dados continua protegido por RLS.

## Banco e atualizações

As 27 tabelas, quatro buckets e 12 Edge Functions já existiam no projeto conectado.
As migrações de documentação de propriedade e embriões já estavam aplicadas.
Não reaplicar migrations do zero nem substituir as proteções existentes pelas
versões antigas do ZIP.

As novas informações dos embriões usam animais.embriao (JSONB), e os campos
compartilhados dos contratos usam vendas.campos_extras (JSONB), sem exigir
novas colunas. Os templates anteriores devem ser preservados ao versionar
os modelos novos.

## Verificação

Executar npm ci e npm run check. Após publicar, verificar HTTPS, abertura direta
das rotas, login, permissões, leitura e gravação, upload e emissão de documentos.
Testes de envio à Meta e WhatsApp dependem das contas e credenciais externas.
