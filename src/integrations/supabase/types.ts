export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      animais: {
        Row: {
          ativo: boolean
          atualizado_em: string
          avaliacoes: Json
          avo_materno_mae: string | null
          avo_materno_pai: string | null
          avo_paterno_mae: string | null
          avo_paterno_pai: string | null
          categoria: string | null
          ce_cm: number | null
          comissao_percentual: number | null
          criado_em: string
          descricao_longa: string | null
          destaque: boolean
          estado_reprodutivo: string | null
          evento_id: string | null
          fazenda: string | null
          ficha: Json
          fornecedor: string | null
          foto_url: string | null
          genetica: Json
          iabcz: number | null
          id: string
          iqg: number | null
          link_erural: string | null
          link_pre_lance: string | null
          link_video: string | null
          localizacao: string | null
          lote: string | null
          mae: string | null
          mgte: number | null
          nascimento: string | null
          nome: string
          pai: string | null
          pai_prenhez: string | null
          parcelas: number | null
          peso_kg: number | null
          preco_total: number | null
          previsao_parto: string | null
          raca: string | null
          registrado_abcz: boolean
          registro: string | null
          sexo: string | null
          valor_parcela: number | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          avaliacoes?: Json
          avo_materno_mae?: string | null
          avo_materno_pai?: string | null
          avo_paterno_mae?: string | null
          avo_paterno_pai?: string | null
          categoria?: string | null
          ce_cm?: number | null
          comissao_percentual?: number | null
          criado_em?: string
          descricao_longa?: string | null
          destaque?: boolean
          estado_reprodutivo?: string | null
          evento_id?: string | null
          fazenda?: string | null
          ficha?: Json
          fornecedor?: string | null
          foto_url?: string | null
          genetica?: Json
          iabcz?: number | null
          id?: string
          iqg?: number | null
          link_erural?: string | null
          link_pre_lance?: string | null
          link_video?: string | null
          localizacao?: string | null
          lote?: string | null
          mae?: string | null
          mgte?: number | null
          nascimento?: string | null
          nome: string
          pai?: string | null
          pai_prenhez?: string | null
          parcelas?: number | null
          peso_kg?: number | null
          preco_total?: number | null
          previsao_parto?: string | null
          raca?: string | null
          registrado_abcz?: boolean
          registro?: string | null
          sexo?: string | null
          valor_parcela?: number | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          avaliacoes?: Json
          avo_materno_mae?: string | null
          avo_materno_pai?: string | null
          avo_paterno_mae?: string | null
          avo_paterno_pai?: string | null
          categoria?: string | null
          ce_cm?: number | null
          comissao_percentual?: number | null
          criado_em?: string
          descricao_longa?: string | null
          destaque?: boolean
          estado_reprodutivo?: string | null
          evento_id?: string | null
          fazenda?: string | null
          ficha?: Json
          fornecedor?: string | null
          foto_url?: string | null
          genetica?: Json
          iabcz?: number | null
          id?: string
          iqg?: number | null
          link_erural?: string | null
          link_pre_lance?: string | null
          link_video?: string | null
          localizacao?: string | null
          lote?: string | null
          mae?: string | null
          mgte?: number | null
          nascimento?: string | null
          nome?: string
          pai?: string | null
          pai_prenhez?: string | null
          parcelas?: number | null
          peso_kg?: number | null
          preco_total?: number | null
          previsao_parto?: string | null
          raca?: string | null
          registrado_abcz?: boolean
          registro?: string | null
          sexo?: string | null
          valor_parcela?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "animais_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      atributos_personalizados: {
        Row: {
          ativo: boolean
          chave: string
          criado_em: string
          id: string
          label: string
          opcoes: Json
          ordem: number
        }
        Insert: {
          ativo?: boolean
          chave: string
          criado_em?: string
          id?: string
          label: string
          opcoes?: Json
          ordem?: number
        }
        Update: {
          ativo?: boolean
          chave?: string
          criado_em?: string
          id?: string
          label?: string
          opcoes?: Json
          ordem?: number
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          faq: Json
          id: string
          layout: Json
          mensagem_padrao: string | null
          whatsapp: string | null
        }
        Insert: {
          faq?: Json
          id?: string
          layout?: Json
          mensagem_padrao?: string | null
          whatsapp?: string | null
        }
        Update: {
          faq?: Json
          id?: string
          layout?: Json
          mensagem_padrao?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      contrato_contratante: {
        Row: {
          atualizado_em: string
          cep: string | null
          cidade: string
          cnpj: string
          criado_em: string
          email: string | null
          endereco: string
          foro: string
          id: string
          inscricao_estadual: string | null
          razao_social: string
          representante_cargo: string | null
          representante_cpf: string
          representante_nome: string
          telefone: string | null
          uf: string
        }
        Insert: {
          atualizado_em?: string
          cep?: string | null
          cidade?: string
          cnpj?: string
          criado_em?: string
          email?: string | null
          endereco?: string
          foro?: string
          id?: string
          inscricao_estadual?: string | null
          razao_social?: string
          representante_cargo?: string | null
          representante_cpf?: string
          representante_nome?: string
          telefone?: string | null
          uf?: string
        }
        Update: {
          atualizado_em?: string
          cep?: string | null
          cidade?: string
          cnpj?: string
          criado_em?: string
          email?: string | null
          endereco?: string
          foro?: string
          id?: string
          inscricao_estadual?: string | null
          razao_social?: string
          representante_cargo?: string | null
          representante_cpf?: string
          representante_nome?: string
          telefone?: string | null
          uf?: string
        }
        Relationships: []
      }
      contrato_templates: {
        Row: {
          ativo: boolean
          atualizado_em: string
          conteudo_html: string
          criado_em: string
          id: string
          nome: string
          tipo: string
          versao: number
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          conteudo_html: string
          criado_em?: string
          id?: string
          nome: string
          tipo?: string
          versao?: number
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          conteudo_html?: string
          criado_em?: string
          id?: string
          nome?: string
          tipo?: string
          versao?: number
        }
        Relationships: []
      }
      contratos: {
        Row: {
          assinado_em: string | null
          assinatura_cpf: string | null
          assinatura_hash: string | null
          assinatura_ip: string | null
          assinatura_nome: string | null
          assinatura_user_agent: string | null
          atualizado_em: string
          conteudo_final: string
          criado_em: string
          criado_por: string | null
          enviado_whatsapp_em: string | null
          id: string
          numero: number
          pdf_path: string | null
          status: string
          template_id: string | null
          tipo: string
          token_publico: string
          venda_id: string
        }
        Insert: {
          assinado_em?: string | null
          assinatura_cpf?: string | null
          assinatura_hash?: string | null
          assinatura_ip?: string | null
          assinatura_nome?: string | null
          assinatura_user_agent?: string | null
          atualizado_em?: string
          conteudo_final: string
          criado_em?: string
          criado_por?: string | null
          enviado_whatsapp_em?: string | null
          id?: string
          numero?: number
          pdf_path?: string | null
          status?: string
          template_id?: string | null
          tipo?: string
          token_publico?: string
          venda_id: string
        }
        Update: {
          assinado_em?: string | null
          assinatura_cpf?: string | null
          assinatura_hash?: string | null
          assinatura_ip?: string | null
          assinatura_nome?: string | null
          assinatura_user_agent?: string | null
          atualizado_em?: string
          conteudo_final?: string
          criado_em?: string
          criado_por?: string | null
          enviado_whatsapp_em?: string | null
          id?: string
          numero?: number
          pdf_path?: string | null
          status?: string
          template_id?: string | null
          tipo?: string
          token_publico?: string
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratos_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contrato_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      disparos: {
        Row: {
          criado_em: string
          id: string
          lista_contatos: Json
          mensagem: string
          status: string
          total_enviados: number
        }
        Insert: {
          criado_em?: string
          id?: string
          lista_contatos?: Json
          mensagem: string
          status?: string
          total_enviados?: number
        }
        Update: {
          criado_em?: string
          id?: string
          lista_contatos?: Json
          mensagem?: string
          status?: string
          total_enviados?: number
        }
        Relationships: []
      }
      documentos_lead: {
        Row: {
          criado_em: string
          enviado_por: string | null
          id: string
          lead_id: string
          mime_type: string | null
          nome: string
          storage_path: string
          tamanho_bytes: number
        }
        Insert: {
          criado_em?: string
          enviado_por?: string | null
          id?: string
          lead_id: string
          mime_type?: string | null
          nome: string
          storage_path: string
          tamanho_bytes?: number
        }
        Update: {
          criado_em?: string
          enviado_por?: string | null
          id?: string
          lead_id?: string
          mime_type?: string | null
          nome?: string
          storage_path?: string
          tamanho_bytes?: number
        }
        Relationships: []
      }
      eventos: {
        Row: {
          ativo: boolean
          criado_em: string
          data: string | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          data?: string | null
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          data?: string | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          criado_em: string
          data_hora: string
          id: string
          lead_id: string
          observacao: string | null
          responsavel_id: string | null
          status: string
          tipo: string
        }
        Insert: {
          criado_em?: string
          data_hora: string
          id?: string
          lead_id: string
          observacao?: string | null
          responsavel_id?: string | null
          status?: string
          tipo?: string
        }
        Update: {
          criado_em?: string
          data_hora?: string
          id?: string
          lead_id?: string
          observacao?: string | null
          responsavel_id?: string | null
          status?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      formularios: {
        Row: {
          ativo: boolean
          atualizado_em: string
          campos: Json
          cor: string
          criado_em: string
          descricao: string | null
          etapa: string | null
          funil_id: string | null
          id: string
          mensagem_sucesso: string
          responsavel_id: string | null
          slug: string
          titulo: string
          total_respostas: number
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          campos?: Json
          cor?: string
          criado_em?: string
          descricao?: string | null
          etapa?: string | null
          funil_id?: string | null
          id?: string
          mensagem_sucesso?: string
          responsavel_id?: string | null
          slug: string
          titulo: string
          total_respostas?: number
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          campos?: Json
          cor?: string
          criado_em?: string
          descricao?: string | null
          etapa?: string | null
          funil_id?: string | null
          id?: string
          mensagem_sucesso?: string
          responsavel_id?: string | null
          slug?: string
          titulo?: string
          total_respostas?: number
        }
        Relationships: []
      }
      funis: {
        Row: {
          ativo: boolean
          cor: string | null
          criado_em: string
          etapas: Json
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          criado_em?: string
          etapas?: Json
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          criado_em?: string
          etapas?: Json
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      interacoes: {
        Row: {
          conteudo: string | null
          criado_em: string
          id: string
          lead_id: string
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          conteudo?: string | null
          criado_em?: string
          id?: string
          lead_id: string
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          conteudo?: string | null
          criado_em?: string
          id?: string
          lead_id?: string
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_contatos: {
        Row: {
          criado_em: string
          id: string
          lead_id: string
          nome: string
          observacao: string | null
          telefone: string | null
        }
        Insert: {
          criado_em?: string
          id?: string
          lead_id: string
          nome: string
          observacao?: string | null
          telefone?: string | null
        }
        Update: {
          criado_em?: string
          id?: string
          lead_id?: string
          nome?: string
          observacao?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          arquivado: boolean
          arquivado_em: string | null
          atualizado_em: string
          campos_extras: Json
          cidade: string | null
          cpf: string | null
          criado_em: string
          deletado_em: string | null
          detalhes_perda: string | null
          entrou_etapa_em: string
          estado: string | null
          etapa: string | null
          fazenda: string | null
          funil_id: string | null
          id: string
          interesse: string | null
          meta_form_id: string | null
          meta_form_nome: string | null
          meta_lead_id: string | null
          motivo_perda: string | null
          nome: string
          numero: number
          observacoes: string | null
          origem: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          respostas_formulario: Json
          status_cadastro: string
          telefone: string | null
          tipo_cliente: string | null
          ultimo_contato: string | null
        }
        Insert: {
          arquivado?: boolean
          arquivado_em?: string | null
          atualizado_em?: string
          campos_extras?: Json
          cidade?: string | null
          cpf?: string | null
          criado_em?: string
          deletado_em?: string | null
          detalhes_perda?: string | null
          entrou_etapa_em?: string
          estado?: string | null
          etapa?: string | null
          fazenda?: string | null
          funil_id?: string | null
          id?: string
          interesse?: string | null
          meta_form_id?: string | null
          meta_form_nome?: string | null
          meta_lead_id?: string | null
          motivo_perda?: string | null
          nome: string
          numero?: number
          observacoes?: string | null
          origem?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          respostas_formulario?: Json
          status_cadastro?: string
          telefone?: string | null
          tipo_cliente?: string | null
          ultimo_contato?: string | null
        }
        Update: {
          arquivado?: boolean
          arquivado_em?: string | null
          atualizado_em?: string
          campos_extras?: Json
          cidade?: string | null
          cpf?: string | null
          criado_em?: string
          deletado_em?: string | null
          detalhes_perda?: string | null
          entrou_etapa_em?: string
          estado?: string | null
          etapa?: string | null
          fazenda?: string | null
          funil_id?: string | null
          id?: string
          interesse?: string | null
          meta_form_id?: string | null
          meta_form_nome?: string | null
          meta_lead_id?: string | null
          motivo_perda?: string | null
          nome?: string
          numero?: number
          observacoes?: string | null
          origem?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          respostas_formulario?: Json
          status_cadastro?: string
          telefone?: string | null
          tipo_cliente?: string | null
          ultimo_contato?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_chat: {
        Row: {
          conteudo: string
          criado_em: string
          direcao: string
          id: string
          lead_id: string
          lido: boolean
        }
        Insert: {
          conteudo: string
          criado_em?: string
          direcao: string
          id?: string
          lead_id: string
          lido?: boolean
        }
        Update: {
          conteudo?: string
          criado_em?: string
          direcao?: string
          id?: string
          lead_id?: string
          lido?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_chat_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_config: {
        Row: {
          app_id: string | null
          ativo: boolean
          atualizado_em: string
          criado_em: string
          id: string
          page_access_token_set: boolean
          paginas_disponiveis: Json | null
          verificado_em: string | null
          verify_token_hint: string | null
        }
        Insert: {
          app_id?: string | null
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          page_access_token_set?: boolean
          paginas_disponiveis?: Json | null
          verificado_em?: string | null
          verify_token_hint?: string | null
        }
        Update: {
          app_id?: string | null
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          page_access_token_set?: boolean
          paginas_disponiveis?: Json | null
          verificado_em?: string | null
          verify_token_hint?: string | null
        }
        Relationships: []
      }
      meta_eventos_log: {
        Row: {
          criado_em: string
          erro: string | null
          form_id: string | null
          id: string
          lead_id: string | null
          leadgen_id: string | null
          payload: Json
          status: string
        }
        Insert: {
          criado_em?: string
          erro?: string | null
          form_id?: string | null
          id?: string
          lead_id?: string | null
          leadgen_id?: string | null
          payload: Json
          status?: string
        }
        Update: {
          criado_em?: string
          erro?: string | null
          form_id?: string | null
          id?: string
          lead_id?: string | null
          leadgen_id?: string | null
          payload?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_eventos_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_formularios: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          etapa: string | null
          form_id: string
          form_nome: string | null
          funil_id: string | null
          id: string
          mapa_campos: Json
          page_id: string | null
          page_nome: string | null
          responsavel_id: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          etapa?: string | null
          form_id: string
          form_nome?: string | null
          funil_id?: string | null
          id?: string
          mapa_campos?: Json
          page_id?: string | null
          page_nome?: string | null
          responsavel_id?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          etapa?: string | null
          form_id?: string
          form_nome?: string | null
          funil_id?: string | null
          id?: string
          mapa_campos?: Json
          page_id?: string | null
          page_nome?: string | null
          responsavel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_formularios_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_formularios_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      motivos_perda: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      pagina_comercial_config: {
        Row: {
          ativo: boolean
          atualizado_em: string
          conteudo: Json
          conteudo_draft: Json | null
          criado_em: string
          etapa_inicial: string | null
          funil_id: string | null
          id: string
          publicado_em: string | null
          publicado_por: string | null
          responsavel_padrao_id: string | null
          tema: Json
          tema_draft: Json | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          conteudo?: Json
          conteudo_draft?: Json | null
          criado_em?: string
          etapa_inicial?: string | null
          funil_id?: string | null
          id?: string
          publicado_em?: string | null
          publicado_por?: string | null
          responsavel_padrao_id?: string | null
          tema?: Json
          tema_draft?: Json | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          conteudo?: Json
          conteudo_draft?: Json | null
          criado_em?: string
          etapa_inicial?: string | null
          funil_id?: string | null
          id?: string
          publicado_em?: string | null
          publicado_por?: string | null
          responsavel_padrao_id?: string | null
          tema?: Json
          tema_draft?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pagina_comercial_config_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagina_comercial_config_responsavel_padrao_id_fkey"
            columns: ["responsavel_padrao_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          email: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          email: string
          id: string
          nome: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          email?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      propostas: {
        Row: {
          animal_id: string | null
          criado_em: string
          email: string | null
          id: string
          lead_id: string | null
          mensagem: string | null
          nome: string
          parcelas: number | null
          telefone: string
          valor_ofertado: number | null
        }
        Insert: {
          animal_id?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          mensagem?: string | null
          nome: string
          parcelas?: number | null
          telefone: string
          valor_ofertado?: number | null
        }
        Update: {
          animal_id?: string | null
          criado_em?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          mensagem?: string | null
          nome?: string
          parcelas?: number | null
          telefone?: string
          valor_ofertado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "propostas_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      respostas_prontas: {
        Row: {
          criado_em: string
          id: string
          pergunta: string
          resposta: string
        }
        Insert: {
          criado_em?: string
          id?: string
          pergunta: string
          resposta: string
        }
        Update: {
          criado_em?: string
          id?: string
          pergunta?: string
          resposta?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          criado_em: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          ativo: boolean
          criado_em: string
          email: string
          id: string
          nome: string
          perfil: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          email: string
          id?: string
          nome: string
          perfil?: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          email?: string
          id?: string
          nome?: string
          perfil?: string
        }
        Relationships: []
      }
      vendas: {
        Row: {
          campos_extras: Json
          categoria: string
          cliente_nome: string
          comissao_percentual: number | null
          criado_em: string
          data_venda: string | null
          fazenda_fornecedor: string | null
          forma_pagamento: string | null
          id: string
          lead_id: string | null
          leilao_evento: string | null
          observacoes: string | null
          parcelamento_descricao: string | null
          produto: string | null
          qtd_parcelas: number | null
          quantidade: number
          status: string
          tipo_parcelamento: string | null
          tipo_vendedor: string
          valor_total: number
          vendedor_externo: string | null
          vendedor_id: string | null
        }
        Insert: {
          campos_extras?: Json
          categoria: string
          cliente_nome: string
          comissao_percentual?: number | null
          criado_em?: string
          data_venda?: string | null
          fazenda_fornecedor?: string | null
          forma_pagamento?: string | null
          id?: string
          lead_id?: string | null
          leilao_evento?: string | null
          observacoes?: string | null
          parcelamento_descricao?: string | null
          produto?: string | null
          qtd_parcelas?: number | null
          quantidade?: number
          status?: string
          tipo_parcelamento?: string | null
          tipo_vendedor?: string
          valor_total: number
          vendedor_externo?: string | null
          vendedor_id?: string | null
        }
        Update: {
          campos_extras?: Json
          categoria?: string
          cliente_nome?: string
          comissao_percentual?: number | null
          criado_em?: string
          data_venda?: string | null
          fazenda_fornecedor?: string | null
          forma_pagamento?: string | null
          id?: string
          lead_id?: string | null
          leilao_evento?: string | null
          observacoes?: string | null
          parcelamento_descricao?: string | null
          produto?: string | null
          qtd_parcelas?: number | null
          quantidade?: number
          status?: string
          tipo_parcelamento?: string | null
          tipo_vendedor?: string
          valor_total?: number
          vendedor_externo?: string | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      pagina_comercial_config_public: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          conteudo: Json | null
          criado_em: string | null
          etapa_inicial: string | null
          funil_id: string | null
          id: string | null
          publicado_em: string | null
          publicado_por: string | null
          responsavel_padrao_id: string | null
          tema: Json | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          conteudo?: Json | null
          criado_em?: string | null
          etapa_inicial?: string | null
          funil_id?: string | null
          id?: string | null
          publicado_em?: string | null
          publicado_por?: string | null
          responsavel_padrao_id?: string | null
          tema?: Json | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          conteudo?: Json | null
          criado_em?: string | null
          etapa_inicial?: string | null
          funil_id?: string | null
          id?: string | null
          publicado_em?: string | null
          publicado_por?: string | null
          responsavel_padrao_id?: string | null
          tema?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pagina_comercial_config_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagina_comercial_config_responsavel_padrao_id_fkey"
            columns: ["responsavel_padrao_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "coordenador" | "vendedor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["coordenador", "vendedor"],
    },
  },
} as const
