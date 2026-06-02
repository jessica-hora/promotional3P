const STORAGE_KEY = 'otimizador3p_history_v2';
const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const formatCurrency = (value) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const formatPercentage = (value) =>
  (value * 100).toFixed(2);

const generateRequestId = () => `opt_req_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

const getSavedHistory = () => {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  try {
    const history = raw ? JSON.parse(raw) : [];
    // Filter out expired items (older than 24 hours)
    const now = Date.now();
    return history.filter((item) => {
      const createdTime = new Date(item.created_at).getTime();
      return now - createdTime < EXPIRATION_TIME;
    });
  } catch {
    return [];
  }
};

const saveHistoryItem = (item) => {
  const history = getSavedHistory();
  const nextHistory = [item, ...history].slice(0, 100);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
};

const buildCsvContent = (recommendations) => {
  const header = [
    'Navigation ID',
    'SKU Seller',
    'Seller ID',
    'Categoria',
    'Preço Atual (R$)',
    'Preço Sugerido (R$)',
    'Investimento Estimado (R$)',
    'Subsídio Magalu (R$)',
    'Demanda Semanal Prevista',
    'GMV Estimado (R$)',
    'ROI Previsto (%)',
  ];

  const lines = recommendations.map((row) => [
    row.navigation_id || 'N/A',
    row.sku_seller || 'N/A',
    row.seller_id || 'N/A',
    row.category || 'N/A',
    row.original_price.toFixed(2).replace('.', ','),
    row.recommended_price_por.toFixed(2).replace('.', ','),
    row.magalu_subsidy_reais.toFixed(2).replace('.', ','),
    row.magalu_subsidy_reais.toFixed(2).replace('.', ','),
    row.predicted_demand_weekly || 0,
    (row.predicted_demand_weekly * row.recommended_price_por).toFixed(2).replace('.', ','),
    ((row.predicted_sku_roi || 0) * 100).toFixed(2).replace('.', ','),
  ].join(';'));

  return [header.join(';'), ...lines].join('\n');
};

const generateRecommendations = ({ budget_limit_reais, objective, max_ip_target, duration_weeks, categories_included, seller_ids_filter }) => {
  const baseSkus = [
    { navigation_id: 'NAV_001', sku_seller: 'EP_1102938', seller_id: 'SELLER_001', category: 'Eletroportateis', base_price: 299.90 },
    { navigation_id: 'NAV_002', sku_seller: 'EP_1102939', seller_id: 'SELLER_002', category: 'Eletroportateis', base_price: 149.90 },
    { navigation_id: 'NAV_003', sku_seller: 'UD_5521847', seller_id: 'SELLER_001', category: 'Utilidades Domésticas', base_price: 89.90 },
    { navigation_id: 'NAV_004', sku_seller: 'UD_5521848', seller_id: 'SELLER_003', category: 'Utilidades Domésticas', base_price: 129.90 },
    { navigation_id: 'NAV_005', sku_seller: 'MODA_8834021', seller_id: 'SELLER_004', category: 'Moda', base_price: 199.90 },
    { navigation_id: 'NAV_006', sku_seller: 'TECH_2201934', seller_id: 'SELLER_002', category: 'Tecnologia', base_price: 599.90 },
    { navigation_id: 'NAV_007', sku_seller: 'HOME_3344829', seller_id: 'SELLER_005', category: 'Casa e Jardim', base_price: 349.90 },
    { navigation_id: 'NAV_008', sku_seller: 'SPORTS_6655421', seller_id: 'SELLER_001', category: 'Esportes', base_price: 249.90 },
  ];

  // Filter by seller IDs if provided
  let filteredSkus = baseSkus;
  if (seller_ids_filter && seller_ids_filter.length > 0) {
    filteredSkus = baseSkus.filter((sku) => seller_ids_filter.includes(sku.seller_id));
  }

  // Filter by categories if provided
  if (categories_included && categories_included.length > 0) {
    filteredSkus = filteredSkus.filter((sku) => categories_included.includes(sku.category));
  }

  // Ensure we have at least some recommendations
  if (filteredSkus.length === 0) {
    filteredSkus = baseSkus.slice(0, 4);
  }

  const isMaxTakeRate = objective === 'MAX_TAKE_RATE_LIQUIDO';
  const investmentPerSku = budget_limit_reais / Math.min(filteredSkus.length, 8);

  return filteredSkus.slice(0, 8).map((sku, index) => {
    const discount = isMaxTakeRate ? 0.08 + index * 0.02 : 0.15 + index * 0.03;
    const recommendedPrice = sku.base_price * (1 - discount);
    const subsidyPercentage = discount * 0.6;
    const subsidy = sku.base_price * subsidyPercentage;
    const demandWeekly = Math.floor(50 + Math.random() * 150);
    const estimatedGmv = recommendedPrice * demandWeekly;
    const roi = investmentPerSku > 0 ? estimatedGmv / investmentPerSku : 0;

    return {
      sku_seller: sku.sku_seller,
      navigation_id: sku.navigation_id,
      seller_id: sku.seller_id,
      category: sku.category,
      original_price: sku.base_price,
      recommended_price_por: parseFloat(recommendedPrice.toFixed(2)),
      magalu_subsidy_reais: parseFloat(subsidy.toFixed(2)),
      predicted_demand_weekly: demandWeekly,
      predicted_sku_roi: parseFloat((roi * 0.1).toFixed(2)), // Adjusted for realism
      estimated_gmv: parseFloat(estimatedGmv.toFixed(2)),
    };
  });
};

const buildSummary = ({ objective, max_ip_target, duration_weeks, categories_included, total_expected_gmv, total_expected_rebate_spend, global_predicted_roi, expected_take_rate_liquido }) => {
  const objectiveLabel = objective === 'MAX_TAKE_RATE_LIQUIDO' ? 'Maximizar TAKE RATE LÍQUIDO' : 'Maximizar GMV';
  const categoriesLabel = categories_included && categories_included.length > 0 ? categories_included.join(', ') : 'Todas as categorias';

  return `
📊 RESUMO DA OTIMIZAÇÃO DE CAMPANHA

📌 Parâmetros da Solicitação:
• Objetivo: ${objectiveLabel}
• Duração: ${duration_weeks} semana(s)
• Índice Pricing Máximo: ${max_ip_target.toFixed(2)}
• Categorias: ${categoriesLabel}

✅ Resultados Esperados:
• GMV Total Esperado: ${formatCurrency(total_expected_gmv)}
• Investimento em Rebate: ${formatCurrency(total_expected_rebate_spend)}
• ROI Global Previsto: ${formatPercentage(global_predicted_roi)}%
• TAKE RATE Líquido Esperado: ${formatCurrency(expected_take_rate_liquido)}

💡 Interpretação:
Para cada R$ 1,00 investido em rebate, você espera gerar ${global_predicted_roi.toFixed(2)}x em GMV incremental.
O resultado líquido (após custos) deve gerar um TAKE RATE de ${formatCurrency(expected_take_rate_liquido)}.

⏱️ Próximas Ações:
1. Revise as recomendações de SKUs e preços abaixo
2. Baixe a planilha completa
3. Importe no sistema de campanhas promocionais
4. Aguarde a campanha ser ativada (suportado por ${duration_weeks * 7} dias)
  `.trim();
};

const optimizeCampaign = async ({
  budget_limit_reais,
  objective,
  max_ip_target,
  type_campaign,
  duration_weeks,
  categories_included,
  seller_ids_filter,
}) => {
  const requestId = generateRequestId();

  const requestPayload = {
    optimization_request: {
      request_id: requestId,
      parameters: {
        budget_limit_reais,
        objective,
        max_ip_target,
        type_campaign,
        duration_weeks,
        categories_included: categories_included || [],
        seller_ids_filter: seller_ids_filter || [],
      },
    },
  };

  // Simulate API call with delay
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

  const recommendations = generateRecommendations({
    budget_limit_reais,
    objective,
    max_ip_target,
    duration_weeks,
    categories_included,
    seller_ids_filter,
  });

  const totalExpectedGmv = recommendations.reduce((sum, r) => sum + r.estimated_gmv, 0);
  const totalExpectedRebateSpend = recommendations.reduce((sum, r) => sum + r.magalu_subsidy_reais, 0);
  const globalPredictedRoi = totalExpectedRebateSpend > 0 ? totalExpectedGmv / totalExpectedRebateSpend : 0;
  const expectedTakeRateLiquido = (totalExpectedGmv - totalExpectedRebateSpend) * 0.05; // 5% take rate

  const summary = buildSummary({
    objective,
    max_ip_target,
    duration_weeks,
    categories_included,
    total_expected_gmv: totalExpectedGmv,
    total_expected_rebate_spend: totalExpectedRebateSpend,
    global_predicted_roi: globalPredictedRoi,
    expected_take_rate_liquido: expectedTakeRateLiquido,
  });

  const fileName = `sugestao_campanha_${Date.now()}.csv`;
  const fileContent = buildCsvContent(recommendations);

  const result = {
    optimization_response: {
      request_id: requestId,
      status: 'SUCCESS',
      processing_time_seconds: 1.5 + Math.random() * 2,
      summary_metrics: {
        total_expected_gmv: parseFloat(totalExpectedGmv.toFixed(2)),
        total_expected_rebate_spend: parseFloat(totalExpectedRebateSpend.toFixed(2)),
        global_predicted_roi: parseFloat(globalPredictedRoi.toFixed(2)),
        expected_take_rate_liquido: parseFloat(expectedTakeRateLiquido.toFixed(2)),
      },
      recommendations,
    },
    summary,
    fileName,
    fileContent,
    requestPayload,
    created_at: new Date().toISOString(),
  };

  persistLog({
    requestPayload,
    responseResult: result,
    status: 'success',
  });

  return result;
};

const persistLog = ({ requestPayload, responseResult, status, errorMessage }) => {
  saveHistoryItem({
    id: generateRequestId(),
    created_at: new Date().toISOString(),
    request_payload: requestPayload,
    response_data: responseResult?.optimization_response || null,
    summary: responseResult?.summary || null,
    status,
    error_message: errorMessage || null,
    file_content: responseResult?.fileContent || null,
    file_name: responseResult?.fileName || null,
  });
};

const fetchHistory = async (limit = 50) => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 300));
  const history = getSavedHistory();
  return history.slice(0, limit);
};

const downloadCsv = (content, filename) => {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export { optimizeCampaign, fetchHistory, downloadCsv };
