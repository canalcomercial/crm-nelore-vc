import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Contrato, ContratoContratante, ContratoTemplate, ContratoTipo } from '@/types/contratos';

export function useContratante() {
  return useQuery({
    queryKey: ['contrato_contratante'],
    queryFn: async (): Promise<ContratoContratante | null> => {
      const { data, error } = await supabase.from('contrato_contratante').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data as ContratoContratante | null;
    },
  });
}

export function useSalvarContratante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<ContratoContratante> & { id: string }) => {
      const { error } = await supabase.from('contrato_contratante').update(p).eq('id', p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contrato_contratante'] });
      toast.success('Dados da contratante salvos');
    },
    onError: (e: Error) => toast.error('Erro ao salvar', { description: e.message }),
  });
}

export function useTemplateAtivo(tipo: ContratoTipo = 'bovinos') {
  return useQuery({
    queryKey: ['contrato_template_ativo', tipo],
    queryFn: async (): Promise<ContratoTemplate | null> => {
      const { data, error } = await supabase
        .from('contrato_templates')
        .select('*')
        .eq('ativo', true)
        .eq('tipo', tipo)
        .order('atualizado_em', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ContratoTemplate | null;
    },
  });
}

export function useTemplatesAtivos() {
  return useQuery({
    queryKey: ['contrato_templates_ativos'],
    queryFn: async (): Promise<ContratoTemplate[]> => {
      const { data, error } = await supabase
        .from('contrato_templates')
        .select('*')
        .eq('ativo', true)
        .order('tipo');
      if (error) throw error;
      return (data ?? []) as ContratoTemplate[];
    },
  });
}

export function useSalvarTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; conteudo_html: string; nome?: string }) => {
      const { error } = await supabase.from('contrato_templates').update({
        conteudo_html: p.conteudo_html,
        ...(p.nome ? { nome: p.nome } : {}),
      }).eq('id', p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contrato_template_ativo'] });
      qc.invalidateQueries({ queryKey: ['contrato_templates_ativos'] });
      toast.success('Template atualizado');
    },
    onError: (e: Error) => toast.error('Erro ao salvar', { description: e.message }),
  });
}

export function useContratosVenda(vendaId: string | null | undefined) {
  return useQuery({
    queryKey: ['contratos_venda', vendaId],
    enabled: !!vendaId,
    queryFn: async (): Promise<Contrato[]> => {
      const { data, error } = await supabase
        .from('contratos')
        .select('*')
        .eq('venda_id', vendaId!)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Contrato[];
    },
  });
}

export function useContratos() {
  return useQuery({
    queryKey: ['contratos_all'],
    queryFn: async (): Promise<Contrato[]> => {
      const { data, error } = await supabase
        .from('contratos')
        .select('*')
        .order('criado_em', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Contrato[];
    },
  });
}

export async function signedPdfUrl(pdfPath: string, expiresIn = 60 * 60 * 24 * 7): Promise<string> {
  const { data, error } = await supabase.storage.from('contratos-pdf').createSignedUrl(pdfPath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadContratoPdf(contratoId: string, blob: Blob): Promise<string> {
  const path = `${contratoId}/contrato-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from('contratos-pdf').upload(path, blob, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export function useCriarContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { venda_id: string; template_id: string; conteudo_final: string; tipo?: ContratoTipo }) => {
      const { data, error } = await supabase
        .from('contratos')
        .insert(p)
        .select('*')
        .single();
      if (error) throw error;
      return data as Contrato;
    },
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['contratos_venda', c.venda_id] });
      qc.invalidateQueries({ queryKey: ['contratos_all'] });
    },
  });
}

export function useAtualizarContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<Contrato> & { id: string }) => {
      const { error } = await supabase.from('contratos').update(p).eq('id', p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contratos_venda'] });
      qc.invalidateQueries({ queryKey: ['contratos_all'] });
    },
  });
}

export function useContratoPorToken(token: string | undefined) {
  return useQuery({
    queryKey: ['contrato_token', token],
    enabled: !!token,
    queryFn: async (): Promise<Contrato | null> => {
      const { data, error } = await supabase.functions.invoke('contrato-publico', {
        body: { token },
      });
      if (error) throw error;
      return ((data as { contrato: Contrato | null } | null)?.contrato ?? null);
    },
  });
}