const STORAGE_KEY = 'otimizador3p_history_v1';

const formatCurrency = (value) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const generateRequestId = () => `REQ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const getSavedHistory = () => {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveHistoryItem = (item) => {
  const history = getSavedHistory();
  const nextHistory = [item, ...history].slice(0, 50);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
};

const buildCsvContent = (rows) => {
  const header = [
    'SKU',
    'Preço Atual',
    'Preço Sugerido',
    'Investimento Estimado',
    'GMV Estimado',
    'GMV Incremental',
  ];
  const lines = rows.map((row) => [
    row.sku,
    formatCurrency(row.current_price),
    formatCurrency(row.suggested_price),
    formatCurrency(row.investment),
    formatCurrency(row.estimated_gmv),
    formatCurrency(row.incremental_gmv),
  ].join(';'));
  return [header.join(';'), ...lines].join('\n');
};

const generateRows = ({ budget }) => {
  const skus = [
    'SKU-1300',
    'SKU-2450',
    'SKU-3105',
    'SKU-4820',
    'SKU-5175',
    'SKU-6210',
  ];

  return skus.map((sku, index) => {
    const currentPrice = 45 + index * 18;
    const suggestedPrice = +(currentPrice * (0.84 + index * 0.03)).toFixed(2);
    const investment = +((budget / skus.length) * (1 + index * 0.05)).toFixed(2);
    const estimatedGmv = +(investment * (1.75 + index * 0.12)).toFixed(2);
    const incrementalGmv = +(estimatedGmv - investment).toFixed(2);

    return {
      sku,
      current_price: currentPrice,
      suggested_price: suggestedPrice,
      investment,
      estimated_gmv: estimatedGmv,
      incremental_gmv: incrementalGmv,
    };
  });
};

const buildSummary = ({ category, campaign_weeks, budget, totalInvestment, estimatedRoi, objective }) =>
  `Sugestão gerada para a categoria ${category} com duração de ${campaign_weeks} semanas. O objetivo selecionado é ${
    objective === 'gmv' ? 'Maximizar GMV' : 'Maximizar Take Rate'
  }. O valor total recomendado para investimento é ${formatCurrency(totalInvestment)} e o ROI projetado é de ${(estimatedRoi * 100).toFixed(1)}%.`;

const createBlobUrl = (content) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  return URL.createObjectURL(blob);
};

const persistLog = ({ requestPayload, responseResult, status, errorMessage }) => {
  saveHistoryItem({
    id: generateRequestId(),
    created_at: new Date().toISOString(),
    request_payload: requestPayload,
    response_summary: responseResult?.summary || null,
    estimated_roi: responseResult?.estimated_roi || null,
    status,
    error_message: errorMessage || null,
    file_content: responseResult?.file_content || null,
    file_name: responseResult?.file_name || null,
    category: requestPayload.category,
    budget: requestPayload.budget,
      objective: requestPayload.objective,
  });
};

const optimizeCampaign = async ({ budget, category, objective, max_pricing_index, campaign_weeks }) => {
  const requestPayload = {
    budget,
    category,
    objective,
    max_pricing_index,
    campaign_weeks,
  };

  await new Promise((resolve) => setTimeout(resolve, 1200));

  const rows = generateRows({ budget });
  const totalInvestment = rows.reduce((sum, row) => sum + row.investment, 0);
  const totalGmv = rows.reduce((sum, row) => sum + row.estimated_gmv, 0);
  const estimatedRoi = totalInvestment > 0 ? totalGmv / totalInvestment : 0;
  const summary = buildSummary({
    category,
    campaign_weeks,
    budget,
    totalInvestment,
    estimatedRoi,
  });
  const fileName = `sugestao-campanha-${Date.now()}.csv`;
  const fileContent = buildCsvContent(rows);

  const result = {
    request_id: generateRequestId(),
    summary,
    estimated_roi: estimatedRoi,
    rows,
    file_name: fileName,
    file_content: fileContent,
    request_payload: requestPayload,
    objective,
    total_investment: totalInvestment,
    category,
    budget,
    campaign_weeks,
    status: 'success',
    created_at: new Date().toISOString(),
  };

  persistLog({ requestPayload, responseResult: result, status: 'success' });

  return result;
};

const fetchHistory = async (limit = 20) => {
  const history = getSavedHistory();
  return history.slice(0, limit);
};

const downloadCsv = (fileContent, fileName) => {
  const url = createBlobUrl(fileContent);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export { optimizeCampaign, fetchHistory, downloadCsv };
