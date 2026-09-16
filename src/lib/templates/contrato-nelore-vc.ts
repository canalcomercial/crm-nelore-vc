/**
 * Modelo oficial NELORE VC — "Contrato de Compra e Venda com Reserva de Domínio"
 * (Nota de Leilão + Nota Promissória Rural Única + Instrumento Particular).
 * Convertido da planilha "CONTRATO MODELO NELORE VC.xls" (abas N.P. e CONTRATO).
 *
 * Este mesmo HTML é gravado no banco pela migration
 * 20260915120000_nelore_vc_contrato_transporte_documentacao.sql
 * e pode ser reaplicado pelo botão "Aplicar modelo Nelore VC" no editor de templates.
 */

const TH = 'border:1px solid #333;padding:3px 6px;font-size:10px;background:#e9e9e9;text-align:center;font-weight:bold;';
const TD = 'border:1px solid #333;padding:4px 6px;font-size:11px;';
const TITULO = 'background:#1f3b2c;color:#fff;font-weight:bold;font-size:11px;padding:4px 8px;text-align:center;letter-spacing:1px;';
const LBL = 'border:1px solid #333;padding:4px 6px;font-size:10px;font-weight:bold;background:#f3f3f3;white-space:nowrap;';

export const TEMPLATE_NELORE_VC_NOME = 'Contrato Nelore VC — Compra e Venda com Reserva de Domínio';

export const TEMPLATE_NELORE_VC_HTML = `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;">
<table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
<tr>
<td style="border:2px solid #1f3b2c;padding:8px 10px;">
<div style="font-size:15px;font-weight:bold;text-align:center;">CONTRATO DE COMPRA E VENDA COM RESERVA DE DOMÍNIO</div>
<div style="font-size:18px;font-weight:bold;text-align:center;color:#1f3b2c;letter-spacing:2px;">NELORE VC</div>
<div style="font-size:11px;text-align:center;">{{contratante_cidade}}/{{contratante_uf}}</div>
</td>
<td style="border:2px solid #1f3b2c;padding:8px 10px;width:190px;font-size:11px;vertical-align:middle;">
<div><strong>CONTRATO Nº:</strong> {{numero_contrato}}</div>
<div><strong>NOTA:</strong> {{bovinos_nota}}</div>
<div><strong>LOTE:</strong> {{bovinos_lote}}</div>
</td>
</tr>
</table>

<div style="${TITULO}">DADOS DO VENDEDOR</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
<tr><td style="${LBL}">VENDEDOR:</td><td style="${TD}">{{contratante_razao_social}}</td><td style="${LBL}">CNPJ/CPF:</td><td style="${TD}">{{contratante_cnpj}}</td></tr>
<tr><td style="${LBL}">ENDEREÇO:</td><td style="${TD}">{{contratante_endereco}} — {{contratante_cidade}}/{{contratante_uf}}</td><td style="${LBL}">FONE:</td><td style="${TD}">{{contratante_telefone}}</td></tr>
</table>

<div style="${TITULO}">DADOS DO COMPRADOR</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
<tr><td style="${TH}">COMPRADOR</td><td style="${TH}">CNPJ/CPF</td><td style="${TH}">CONTATO 1</td><td style="${TH}">CONTATO 2</td></tr>
<tr><td style="${TD}">{{cliente_nome}}</td><td style="${TD}">{{cliente_cpf}}</td><td style="${TD}">{{cliente_telefone}}</td><td style="${TD}">{{bovinos_contato_2}}</td></tr>
</table>
<table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
<tr><td style="${LBL}">ENDEREÇO:</td><td style="${TD}" colspan="3">{{cliente_endereco_propriedade}}</td></tr>
<tr><td style="${LBL}">CIDADE / UF:</td><td style="${TD}">{{cliente_cidade}}/{{cliente_estado}}</td><td style="${LBL}">CEP:</td><td style="${TD}">{{bovinos_cep}}</td></tr>
<tr><td style="${LBL}">FAZENDA:</td><td style="${TD}">{{cliente_fazenda}}</td><td style="${LBL}">INSC.:</td><td style="${TD}">{{cliente_inscricao_estadual}}</td></tr>
<tr><td style="${LBL}">NIRF:</td><td style="${TD}">{{cliente_nirf}}</td><td style="${LBL}">CIB:</td><td style="${TD}">{{cliente_cib}}</td></tr>
<tr><td style="${LBL}">CÓD. PROPRIEDADE:</td><td style="${TD}">{{cliente_codigo_propriedade}}</td><td style="${LBL}">MUNICÍPIO:</td><td style="${TD}">{{cliente_cidade}}/{{cliente_estado}}</td></tr>
<tr><td style="${LBL}">NOTA FISCAL EM NOME DE:</td><td style="${TD}">{{bovinos_nf_nome}}</td><td style="${LBL}">INSC.:</td><td style="${TD}">{{bovinos_nf_inscricao}}</td></tr>
<tr><td style="${LBL}">MUNICÍPIO (NF):</td><td style="${TD}" colspan="3">{{bovinos_nf_municipio}}</td></tr>
</table>

<div style="${TITULO}">ESPECIFICAÇÃO DO LOTE</div>
<div style="border:1px solid #333;border-top:none;padding:6px 8px;font-size:11px;min-height:36px;white-space:pre-line;margin-bottom:8px;">{{bovinos_especificacao_lote}}</div>

<div style="${TITULO}">DADOS DA VENDA</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
<tr><td style="${TH}">VLR. LANCE</td><td style="${TH}">CONDIÇÃO DE PAGAMENTO</td><td style="${TH}">QUANT.</td><td style="${TH}">VLR. TOTAL</td><td style="${TH}">VLR. UNITÁRIO</td><td style="${TH}">VLR. DESC.</td><td style="${TH}">% COMISSÃO</td><td style="${TH}">VLR. COMISSÃO</td></tr>
<tr><td style="${TD}text-align:center;">{{bovinos_valor_lance}}</td><td style="${TD}text-align:center;">{{parcelamento_descricao}}</td><td style="${TD}text-align:center;">{{quantidade}}</td><td style="${TD}text-align:center;">{{valor_total}}</td><td style="${TD}text-align:center;">{{valor_unitario}}</td><td style="${TD}text-align:center;">{{bovinos_valor_desconto}}</td><td style="${TD}text-align:center;">{{bovinos_comissao_percentual}}</td><td style="${TD}text-align:center;">{{bovinos_valor_comissao}}</td></tr>
</table>

<p style="font-size:11px;margin:6px 0;">O valor total do negócio é de <strong>{{bovinos_valor_liquido}}</strong> ({{bovinos_valor_liquido_extenso}}), que serão pagos em <strong>{{bovinos_qtd_parcelas}}</strong> parcela(s), sendo:</p>
{{tabela_parcelas_html}}

<p style="font-size:11px;text-align:right;margin:10px 0 26px;">{{contratante_cidade}}/{{contratante_uf}}, {{data_venda_maiuscula}}</p>

<table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
<tr>
<td style="width:50%;text-align:center;font-size:11px;padding:0 10px;">______________________________________<br/><strong>{{contratante_razao_social}}</strong><br/>VENDEDOR</td>
<td style="width:50%;text-align:center;font-size:11px;padding:0 10px;">______________________________________<br/><strong>{{cliente_nome}}</strong><br/>COMPRADOR</td>
</tr>
</table>

<div class="quebra-pagina" style="border-top:1px dashed #bbb;margin:28px 0;"></div>

<div style="border:2px dashed #555;padding:8px 10px;font-family:Arial,Helvetica,sans-serif;color:#111;">
<div style="${TITULO}">NOTA PROMISSÓRIA RURAL ÚNICA</div>
<table style="width:100%;border-collapse:collapse;margin:6px 0;">
<tr><td style="font-size:11px;font-weight:bold;">LOTE {{bovinos_lote}} — NP ÚNICA — VENCIMENTO EM ____/____/________</td><td style="font-size:13px;font-weight:bold;text-align:right;">{{bovinos_valor_liquido}}</td></tr>
</table>
<p style="font-size:11px;margin:4px 0;">AO(S) ____º DIA DO MÊS DE ______________ DO ANO DE ________ PAGAREI POR ESTA ÚNICA VIA DE NOTA PROMISSÓRIA</p>
<p style="font-size:11px;margin:4px 0;">A <strong>{{contratante_razao_social}}</strong>, CPF/CNPJ {{contratante_cnpj}}, OU À SUA ORDEM, A QUANTIA DE <strong>{{bovinos_valor_liquido}}</strong> ({{bovinos_valor_liquido_extenso}})</p>
<p style="font-size:11px;margin:4px 0;">EM MOEDA CORRENTE DO PAÍS NA PRAÇA DE {{bovinos_praca}}, PELA VENDA DE:</p>
<div style="font-size:11px;border:1px solid #999;padding:4px 6px;min-height:24px;white-space:pre-line;margin:4px 0 10px;">{{bovinos_especificacao_lote}}</div>
<table style="width:100%;border-collapse:collapse;">
<tr>
<td style="width:55%;font-size:11px;vertical-align:top;line-height:1.5;">
<strong>EMITENTE:</strong> {{cliente_nome}}<br/>
<strong>CPF/CNPJ:</strong> {{cliente_cpf}}<br/>
<strong>FAZENDA:</strong> {{cliente_fazenda}}<br/>
<strong>CIDADE/UF:</strong> {{cliente_cidade}}/{{cliente_estado}}<br/>
<strong>CONTATO:</strong> {{cliente_telefone}}
</td>
<td style="width:45%;font-size:11px;text-align:center;vertical-align:top;">
{{contratante_cidade}}/{{contratante_uf}}, {{data_venda_maiuscula}}<br/><br/><br/>
____________________________________<br/><strong>{{cliente_nome}}</strong>
</td>
</tr>
</table>
</div>
</div>

<div class="quebra-pagina" style="border-top:1px dashed #bbb;margin:28px 0;"></div>

<div style="font-family:Georgia,'Times New Roman',serif;color:#111;font-size:12.5px;line-height:1.55;text-align:justify;">
<h2 style="text-align:center;font-size:15px;margin:0 0 12px;">INSTRUMENTO PARTICULAR DE CONTRATO DE COMPRA E VENDA DE BEM(S) COM RESERVA DE DOMÍNIO</h2>
<p style="text-align:center;font-size:11px;margin:0 0 12px;">Contrato nº {{numero_contrato}} · Nota {{bovinos_nota}} · Lote {{bovinos_lote}}</p>

<p>Por este INSTRUMENTO PARTICULAR DE CONTRATO DE COMPRA E VENDA DE BEM(S) COM RESERVA DE DOMÍNIO, que entre si fazem o VENDEDOR <strong>{{contratante_razao_social}}</strong> (CPF/CNPJ {{contratante_cnpj}}) e o COMPRADOR <strong>{{cliente_nome}}</strong> (CPF/CNPJ {{cliente_cpf}}), qualificados na Nota de Leilão que passa a fazer parte integrante deste instrumento, têm entre si justo e contratado as seguintes cláusulas e condições, a saber:</p>

<p><strong>Cláusula 1ª.</strong> O VENDEDOR é legítimo proprietário dos bens semoventes e/ou produtos ora alienados, comprometendo-se a entregá-los ao COMPRADOR mediante a assinatura do presente Instrumento e pagamento do sinal acordado, bem como observadas todas as demais condições estabelecidas no Regulamento do Leilão.</p>
<p><strong>§1º.</strong> Em garantia do negócio jurídico ora encetado, o COMPRADOR emitirá a competente NOTA PROMISSÓRIA RURAL ÚNICA, assinada na praça do domicílio do VENDEDOR, que somente será devolvida na quitação de todas as parcelas, restando pactuado que o valor integral da Nota Promissória Rural Única não estará sujeito a reduções, deflação ou descontos a qualquer título.</p>
<p><strong>§2º.</strong> Como sinal de negócio e princípio de pagamento, o COMPRADOR pagará o valor líquido e certo constante da Nota de Leilão que é parte do presente instrumento, o qual deverá ser pago na data da arrematação, acaso ainda haja expediente bancário ou impreterivelmente até o primeiro dia útil subsequente à arrematação, caso a mesma ocorra em dia não útil.</p>

<p><strong>Cláusula 2ª.</strong> Nos termos do artigo 521 e seguintes do Código Civil Brasileiro, resta expressamente instituída cláusula de reserva de domínio, restando reservada ao VENDEDOR a propriedade dos bens ora alienados, inclusive das crias nascidas após a venda, até que o preço acordado esteja integralmente pago.</p>
<p><strong>§1º.</strong> Reservado o domínio em favor do VENDEDOR, a transferência da propriedade ao COMPRADOR dá-se no momento em que o preço estiver integralmente pago. Todavia, pelos riscos da coisa responde o COMPRADOR a partir da batida do martelo.</p>
<p><strong>§2º.</strong> Assume o COMPRADOR a condição de fiel depositário do bem objeto de garantia e, constituído em mora, obriga-se a restituí-lo de imediato, sob pena de responder a procedimento civil e criminal.</p>
<p><strong>§3º.</strong> Enquanto não operado o domínio em favor do COMPRADOR, o mesmo compromete-se a manter os bens semoventes e/ou produtos adquiridos em perfeitas condições físicas, dispensando-lhes adequado tratamento sanitário e boa alimentação, tudo em conformidade com as orientações técnicas, responsabilizando-se, inclusive, pela aplicação de todas as vacinas e condutas veterinárias necessárias, sob pena de responder pelas perdas e danos advindas de sua conduta.</p>

<p><strong>Cláusula 3ª.</strong> É assistido ao VENDEDOR o direito de efetuar monitoramentos dos animais enquanto mantida a reserva do domínio, restando facultado ao mesmo mediante ajuste prévio entre as partes o ingresso em sua propriedade para as avaliações e emissão de relatórios técnicos.</p>

<p><strong>Cláusula 4ª.</strong> Na hipótese de retomada dos semoventes por conta do inadimplemento contratual, resta o VENDEDOR e/ou seus representantes legais expressamente autorizados a atuar junto aos órgãos públicos em busca da emissão dos competentes documentos fiscais e sanitários que autorizem o transporte dos animais.</p>

<p><strong>Cláusula 5ª.</strong> Na hipótese de inadimplemento, neste compreendido inclusive atrasos no pagamento das parcelas do preço, o COMPRADOR será constituído em mora mediante o protesto do título ou interpelação judicial.</p>
<p><strong>Parágrafo único.</strong> Verificada a mora do COMPRADOR, poderá o VENDEDOR mover contra ele a competente ação de cobrança, execução ou outra medida judicial que julgar cabível, a seu critério, das prestações vencidas e vincendas e o mais que lhe for devido, ou poderá recuperar a posse da coisa vendida, lhe restando facultado, nesta hipótese, reter as prestações pagas até o necessário para cobrir a depreciação da coisa, as despesas feitas, eventual multa contratual e o mais que de direito lhe for devido.</p>

<p><strong>Cláusula 6ª.</strong> No caso de impontualidade no pagamento dos valores pactuados, haverá a incidência de multa de 2% (dois por cento) do valor do débito, juros de mora de 1% (um por cento) ao mês, bem como correção monetária através do índice IGPM-FGV ou outro que o venha a substituir, não se aplicando, em qualquer hipótese, índices deflatores.</p>
<p><strong>§1º.</strong> A cobrança judicial sujeitará o COMPRADOR ao pagamento das custas processuais, bem como dos honorários advocatícios estipulados em 20% (vinte por cento).</p>
<p><strong>§2º.</strong> Se o COMPRADOR deixar de cumprir qualquer obrigação por ele expressamente assumida nos termos deste contrato, operar-se-á o vencimento antecipado das parcelas vincendas, as quais serão consideradas antecipadamente vencidas e imediatamente exigíveis, independentemente de aviso, interpelação ou notificação judicial ou extrajudicial.</p>
<p><strong>§3º.</strong> Ainda, considerar-se-á rescindido o presente instrumento com o vencimento antecipado das obrigações assumidas caso o COMPRADOR não der imediata e expressa ciência ao VENDEDOR de qualquer ação, penhora, execução ou turbação de terceiros que venha a recair sobre tais bens; se tornar insolvente ou falir; bem como se deixar, quando justificadamente solicitado pelo VENDEDOR, de substituir os Avalistas.</p>

<p><strong>Cláusula 7ª.</strong> No caso de o VENDEDOR considerar rescindido o presente contrato em razão de inadimplemento contratual do COMPRADOR, aquele poderá ser reintegrado liminarmente na posse dos bens vendidos, restando facultado ao COMPRADOR purgar a mora mediante o pagamento da integralidade do valor remanescente do preço, acrescido de juros moratórios, correção monetária, multa, eventuais custos com a apreensão dos bens objeto deste instrumento, além de custas processuais e honorários advocatícios.</p>

<p><strong>Cláusula 8ª.</strong> Concorda com os termos fixados no presente contrato o Avalista devidamente qualificado na Nota de Leilão integrante deste instrumento, o qual o subscreve conjuntamente com as demais partes contratantes, que se configura também como principal pagador das obrigações nele constantes, comprometendo pela totalidade do contrato, inclusive multa, juros, correção e quaisquer encargos decorrentes da inadimplência, o qual renuncia a eventual benefício de ordem em favor do VENDEDOR, responsabilizando-se solidariamente e ilimitadamente pelo fiel cumprimento do presente sem exceção de quaisquer cláusulas.</p>

<p><strong>Cláusula 9ª.</strong> Caso sejam descumpridas quaisquer obrigações provenientes deste contrato, estabelecem as partes multa contratual equivalente a 20% (vinte por cento) do valor do presente instrumento em favor da parte inocente.</p>
<p><strong>§1º.</strong> Caso o COMPRADOR desista da compra após a batida do martelo, sujeitar-se-á ao pagamento da multa contratual acima estipulada, responsabilizando-se, ainda, pelo pagamento da comissão devida à Leiloeira.</p>
<p><strong>§2º.</strong> Caso o COMPRADOR desista da compra após o pagamento do sinal, sujeitar-se-á ao pagamento da multa contratual acima estipulada, da qual será abatido o valor pago a título de sinal, responsabilizando-se, ainda, pelo pagamento da comissão devida à Leiloeira.</p>

<p><strong>Cláusula 10ª.</strong> Os bens deverão ser entregues em conformidade com as informações repassadas ao seu respeito pelo leiloeiro no momento de sua descrição, não podendo o COMPRADOR recusá-los por subjetividades ou pequenos vícios que não desqualifiquem sua raça.</p>
<p><strong>Parágrafo único.</strong> Antes do leilão é facultado ao COMPRADOR vistoriar pessoalmente ou através de médico veterinário e/ou técnico por ele designado os animais ou produtos a serem leiloados, sob pena de não poder recusá-los após a batida do martelo, tão menos exigir a redução de seu preço, a não ser que o mesmo apresente vício que o desqualifique de sua raça.</p>

<p><strong>Cláusula 11ª.</strong> Em caso de morte dos animais ou perecimento dos produtos já na posse do COMPRADOR, tal fato não o desobrigará do pagamento de todo o saldo devedor. Todavia, se a morte ou perecimento comprovadamente se der por culpa do VENDEDOR, caberá ao COMPRADOR o direito de ser ressarcido dos valores pagos, assim como das perdas e danos porventura experimentadas, OU a substituição dos animais ou produtos por outros da mesma espécie, categoria e qualidade.</p>

<p><strong>Cláusula 12ª.</strong> A tradição da coisa vendida dar-se-á com a batida do martelo, sendo que a retirada dos bens deverá ser realizada no ponto de entrega anunciado no início do leilão.</p>
<p><strong>Parágrafo único.</strong> Ainda que os bens sejam expedidos para lugar diverso por convenção das partes, mesmo que as despesas de transporte sejam custeadas pelo VENDEDOR, por conta do COMPRADOR correrão os riscos, uma vez que é responsável pelos bens desde a batida do martelo.</p>

<p><strong>Cláusula 13ª.</strong> O COMPRADOR declara-se ciente de que, tendo adquirido os animais e/ou produtos através da intermediação de Leiloeira, sujeitar-se-á ao pagamento de comissão de compra, que consiste na quantia paga pelo comprador à mesma, a qual será anunciada pelo leiloeiro no início do leilão, cujo percentual incidirá sobre o valor total de cada lote apregoado e arrematado pelo COMPRADOR, restando desde já avençado que a praça de pagamento da comissão é a do domicílio da Leiloeira, sendo assim eleito o foro da Comarca de Londrina-PR para dirimir quaisquer dúvida ou divergência quanto às comissões devidas.</p>
<p><strong>§1º.</strong> O COMPRADOR declara-se ciente de que a comissão é devida à Leiloeira mediante a arrematação do lote, ainda que o negócio jurídico venha a ser rescindido pelas partes por qualquer motivo que seja.</p>
<p><strong>§2º.</strong> Eventuais alterações de valores decorrentes de negociações realizadas diretamente entre as partes posteriormente à arrematação não ensejarão a redução ou majoração dos valores devidos a título de comissão, a qual incidirá sobre o valor total da arrematação.</p>

<p><strong>Cláusula 14ª.</strong> As partes declaram-se cientes e consentem que os leilões e contatos telefônicos e/ou virtuais havidos entre as partes e a Leiloeira poderão ser por esta registrados em mídia, prestando-se tais registros a fazerem prova das negociações encetadas entre as partes.</p>
<p><strong>§1º.</strong> Consistindo o presente instrumento em documento particular assinado pelo devedor, avalista e por 2 (duas) testemunhas, as partes atribuem ao presente instrumento natureza jurídica de título executivo extrajudicial, em conformidade com o disposto no artigo 784, III do Código de Processo Civil.</p>
<p><strong>§2º.</strong> Nos termos do §5º do artigo 129 da Lei 6.015/73, faculta-se às partes o registro do presente instrumento perante o Cartório de Registro de Títulos e Documentos.</p>

<p><strong>Cláusula 15ª.</strong> Este contrato obriga não somente as partes signatárias, como seus herdeiros e sucessores.</p>

<p><strong>Cláusula 16ª.</strong> Elegem as partes o foro da Comarca do domicílio do VENDEDOR ({{contratante_foro}}) para dirimirem qualquer dúvida ou divergência oriunda da execução deste contrato, renunciando a qualquer outro, por mais privilegiado que seja.</p>

<p>E, por estarem assim justos e contratados, firmam este instrumento.</p>

<p style="text-align:right;margin:18px 0 34px;">{{contratante_cidade}}/{{contratante_uf}}, {{data_venda_curta}}</p>

<table style="width:100%;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;">
<tr>
<td style="width:50%;text-align:center;font-size:11px;padding:0 10px 30px;">______________________________________<br/><strong>{{contratante_razao_social}}</strong><br/>VENDEDOR — CPF/CNPJ {{contratante_cnpj}}</td>
<td style="width:50%;text-align:center;font-size:11px;padding:0 10px 30px;">______________________________________<br/><strong>{{cliente_nome}}</strong><br/>COMPRADOR — CPF/CNPJ {{cliente_cpf}}</td>
</tr>
<tr>
<td style="width:50%;text-align:center;font-size:11px;padding:0 10px 30px;">______________________________________<br/><strong>{{bovinos_avalista_nome}}</strong><br/>AVALISTA — CPF/CNPJ {{bovinos_avalista_cpf}}</td>
<td style="width:50%;"></td>
</tr>
<tr>
<td style="width:50%;text-align:center;font-size:11px;padding:0 10px;">______________________________________<br/><strong>{{bovinos_testemunha1}}</strong><br/>TESTEMUNHA 1</td>
<td style="width:50%;text-align:center;font-size:11px;padding:0 10px;">______________________________________<br/><strong>{{bovinos_testemunha2}}</strong><br/>TESTEMUNHA 2</td>
</tr>
</table>
</div>`;
