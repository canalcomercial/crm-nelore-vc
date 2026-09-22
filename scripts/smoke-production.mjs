import fs from 'node:fs';
import assert from 'node:assert/strict';

const config = Object.fromEntries(fs.readFileSync(new URL('../.env.production', import.meta.url), 'utf8')
  .split(/\r?\n/).filter(line => line && !line.startsWith('#')).map(line => {
    const i = line.indexOf('='); return [line.slice(0,i),line.slice(i+1)];
  }));
const base = config.VITE_SUPABASE_URL;
const key = config.VITE_SUPABASE_PUBLISHABLE_KEY;
const headers = { apikey:key, Authorization:`Bearer ${key}` };
const results=[];
for (const site of ['https://nelorevc.com', 'https://www.nelorevc.com']) {
  for (const route of ['/', '/auth', '/catalogo']) {
    const response = await fetch(site + route);
    assert.equal(response.status, 200, `${site}${route}`);
    assert.match(await response.text(), /id="root"/, 'A rota deve entregar o aplicativo');
    results.push({name:site + route,status:response.status});
  }
}
async function check(name, path, expected, init={}) {
  const response=await fetch(base+path,{headers:{...headers,'Content-Type':'application/json'},...init});
  const body=await response.text();
  assert.ok(expected.includes(response.status),`${name}: HTTP ${response.status} ${body.slice(0,120)}`);
  results.push({name,status:response.status});
  return body;
}
await check('Catálogo público','/rest/v1/animais?select=id&limit=1',[200]);
await check('Eventos públicos','/rest/v1/eventos?select=id,tipo,detalhes&limit=1',[200]);
await check('Configuração publicada','/rest/v1/pagina_comercial_config_public?select=id,conteudo,tema&limit=1',[200]);
await check('Rascunho bloqueado para visitante','/rest/v1/pagina_comercial_config?select=conteudo_draft&limit=1',[401,403]);
const leads=await check('Leads protegidos','/rest/v1/leads?select=id&limit=1',[200,401,403]);
if(leads.startsWith('[')) assert.equal(JSON.parse(leads).length,0,'Visitante não pode ler leads');
for(const name of ['criar-membro','excluir-membro','meta-listar-forms','meta-reprocessar-evento','meta-testar-conexao']){
  await check(name+' rejeita visitante','/functions/v1/'+name,[401,403],{method:'POST',body:'{}'});
}
for(const name of ['pagina-comercial-lead','receber-proposta','submeter-formulario']){
  await check(name+' valida entrada','/functions/v1/'+name,[400,404,422],{method:'POST',body:'{}'});
}
await check('Contrato inexistente','/functions/v1/contrato-publico',[400,404],{method:'POST',body:'{}'});
await check('Assinatura inválida','/functions/v1/assinar-contrato',[400,404],{method:'POST',body:'{}'});
console.log(JSON.stringify(results,null,2));
