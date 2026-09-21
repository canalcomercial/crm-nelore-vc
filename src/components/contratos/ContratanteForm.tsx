import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useContratante, useSalvarContratante } from '@/hooks/useContratos';
import { Building2, Loader2 } from 'lucide-react';

export function ContratanteForm() {
  const { data, isLoading } = useContratante();
  const salvar = useSalvarContratante();
  const [f, setF] = useState({
    razao_social: '', cnpj: '', inscricao_estadual: '', endereco: '',
    cidade: '', uf: '', cep: '', representante_nome: '', representante_cpf: '',
    representante_cargo: '', foro: '', telefone: '', email: '',
    fazenda_nome: '', endereco_propriedade: '', municipio_propriedade: '',
    nirf: '', cib: '', codigo_propriedade: '',
  });

  useEffect(() => {
    if (data) {
      setF({
        razao_social: data.razao_social || '',
        cnpj: data.cnpj || '',
        inscricao_estadual: data.inscricao_estadual || '',
        endereco: data.endereco || '',
        cidade: data.cidade || '',
        uf: data.uf || '',
        cep: data.cep || '',
        representante_nome: data.representante_nome || '',
        representante_cpf: data.representante_cpf || '',
        representante_cargo: data.representante_cargo || '',
        foro: data.foro || '',
        telefone: data.telefone || '',
        email: data.email || '',
        fazenda_nome: data.fazenda_nome || '',
        endereco_propriedade: data.endereco_propriedade || '',
        municipio_propriedade: data.municipio_propriedade || '',
        nirf: data.nirf || '',
        cib: data.cib || '',
        codigo_propriedade: data.codigo_propriedade || '',
      });
    }
  }, [data]);

  if (isLoading) return <div className="p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Dados da empresa contratante</h2>
      </div>
      <p className="text-xs text-muted-foreground">Estes dados são inseridos automaticamente em todo contrato emitido.</p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Razão social *" value={f.razao_social} onChange={(v) => setF({ ...f, razao_social: v })} full />
        <Field label="CNPJ *" value={f.cnpj} onChange={(v) => setF({ ...f, cnpj: v })} />
        <Field label="Inscrição estadual" value={f.inscricao_estadual} onChange={(v) => setF({ ...f, inscricao_estadual: v })} />
        <Field label="Endereço completo *" value={f.endereco} onChange={(v) => setF({ ...f, endereco: v })} full />
        <Field label="Cidade *" value={f.cidade} onChange={(v) => setF({ ...f, cidade: v })} />
        <Field label="UF *" value={f.uf} onChange={(v) => setF({ ...f, uf: v.toUpperCase().slice(0, 2) })} />
        <Field label="CEP" value={f.cep} onChange={(v) => setF({ ...f, cep: v })} />
        <Field label="Foro (cidade/UF) *" value={f.foro} onChange={(v) => setF({ ...f, foro: v })} />
        <Field label="Representante legal *" value={f.representante_nome} onChange={(v) => setF({ ...f, representante_nome: v })} />
        <Field label="CPF do representante *" value={f.representante_cpf} onChange={(v) => setF({ ...f, representante_cpf: v })} />
        <Field label="Cargo do representante" value={f.representante_cargo} onChange={(v) => setF({ ...f, representante_cargo: v })} />
        <Field label="Telefone" value={f.telefone} onChange={(v) => setF({ ...f, telefone: v })} />
        <Field label="E-mail" value={f.email} onChange={(v) => setF({ ...f, email: v })} full />
      </div>

      <div className="pt-2">
        <h3 className="text-sm font-semibold">Documentação da propriedade (vendedor)</h3>
        <p className="text-xs text-muted-foreground">Usada na nota de transporte que acompanha o caminhoneiro.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome da fazenda" value={f.fazenda_nome} onChange={(v) => setF({ ...f, fazenda_nome: v })} />
        <Field label="Município / UF da propriedade" value={f.municipio_propriedade} onChange={(v) => setF({ ...f, municipio_propriedade: v })} />
        <Field label="Endereço da propriedade" value={f.endereco_propriedade} onChange={(v) => setF({ ...f, endereco_propriedade: v })} full />
        <Field label="NIRF" value={f.nirf} onChange={(v) => setF({ ...f, nirf: v })} />
        <Field label="CIB" value={f.cib} onChange={(v) => setF({ ...f, cib: v })} />
        <Field label="Código da propriedade" value={f.codigo_propriedade} onChange={(v) => setF({ ...f, codigo_propriedade: v })} />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => data && salvar.mutate({ id: data.id, ...f })} disabled={salvar.isPending || !data}>
          {salvar.isPending ? 'Salvando...' : 'Salvar dados'}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, full }: { label: string; value: string; onChange: (v: string) => void; full?: boolean }) {
  return (
    <div className={`space-y-1 ${full ? 'col-span-2' : ''}`}>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 text-sm" />
    </div>
  );
}