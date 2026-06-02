import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { optimizeCampaign, downloadCsv } from '../services/api';

const OptimizationPage = () => {
  const categoriesOptions = [
    'Eletroportateis',
    'Utilidades Domésticas',
    'Moda',
    'Tecnologia',
    'Casa e Jardim',
    'Esportes',
  ];

  const typeCampaignOptions = [
    { value: 'a_prazo', label: 'Campanha à Prazo' },
    { value: 'a_vista', label: 'Campanha à Vista' },
    { value: 'frete', label: 'Campanha de Frete' },
    { value: 'cupom', label: 'Campanha com Cupom' },
  ];

  const [formData, setFormData] = useState({
    budget_limit_reais: '',
    objective: 'MAX_GMV',
    max_ip_target: '1.03',
    type_campaign: 'a_prazo',
    duration_weeks: '2',
    categories_included: [],
    seller_ids_filter: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryToggle = (category) => {
    setFormData((prev) => {
      const categories = prev.categories_included.includes(category)
        ? prev.categories_included.filter((c) => c !== category)
        : [...prev.categories_included, category];
      return { ...prev, categories_included: categories };
    });
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.budget_limit_reais) {
      errors.push('Orçamento é obrigatório');
    } else if (parseFloat(formData.budget_limit_reais) < 100) {
      errors.push('Orçamento mínimo é R$ 100');
    }

    if (!formData.objective) {
      errors.push('Objetivo é obrigatório');
    }

    if (!formData.max_ip_target || parseFloat(formData.max_ip_target) <= 0) {
      errors.push('Índice Pricing máximo é obrigatório e deve ser > 0');
    }

    if (!formData.duration_weeks || parseInt(formData.duration_weeks) < 1) {
      errors.push('Duração deve ser >= 1 semana');
    }

    if (errors.length > 0) {
      setError(errors.join('; '));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const sellerIds = formData.seller_ids_filter
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      const response = await optimizeCampaign({
        budget_limit_reais: parseFloat(formData.budget_limit_reais),
        objective: formData.objective,
        max_ip_target: parseFloat(formData.max_ip_target),
        type_campaign: formData.type_campaign,
        duration_weeks: parseInt(formData.duration_weeks, 10),
        categories_included: formData.categories_included,
        seller_ids_filter: sellerIds,
      });

      setResult(response);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Erro ao processar otimização. Tente novamente.');
      console.error('Optimization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResult = () => {
    if (result?.fileContent && result?.fileName) {
      downloadCsv(result.fileContent, result.fileName);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
          📊 Otimizador de Campanhas Promocionais
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Solicite uma sugestão de composição de campanha baseada em seu orçamento e objetivos
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Form Card */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 2, border: '1px solid #E5E5E5' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#EC5A10' }}>
                📝 Parâmetros da Campanha
              </Typography>

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Budget Field */}
                <TextField
                  label="Orçamento a Investir (R$)"
                  name="budget_limit_reais"
                  type="number"
                  value={formData.budget_limit_reais}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="Ex: 150000"
                  inputProps={{ step: '100', min: '100' }}
                  variant="outlined"
                  size="small"
                  required
                  helperText="Valor mínimo: R$ 100"
                />

                {/* Objective Field */}
                <FormControl fullWidth size="small">
                  <InputLabel>Objetivo da Otimização</InputLabel>
                  <Select
                    name="objective"
                    value={formData.objective}
                    onChange={handleInputChange}
                    label="Objetivo da Otimização"
                  >
                    <MenuItem value="MAX_GMV">Maximizar GMV</MenuItem>
                    <MenuItem value="MAX_TAKE_RATE_LIQUIDO">Maximizar TAKE RATE Líquido</MenuItem>
                  </Select>
                </FormControl>

                {/* Max Pricing Index */}
                <TextField
                  label="Índice Pricing Máximo (IP)"
                  name="max_ip_target"
                  type="number"
                  value={formData.max_ip_target}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="Ex: 1.03"
                  inputProps={{ step: '0.01', min: '0.01' }}
                  variant="outlined"
                  size="small"
                  required
                  helperText="Ex: 1.03 = até 3% acima do preço"
                />

                <Divider sx={{ my: 1 }} />

                {/* Type Campaign */}
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Campanha</InputLabel>
                  <Select
                    name="type_campaign"
                    value={formData.type_campaign}
                    onChange={handleInputChange}
                    label="Tipo de Campanha"
                  >
                    {typeCampaignOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Campaign Duration */}
                <TextField
                  label="Duração da Campanha (semanas)"
                  name="duration_weeks"
                  type="number"
                  value={formData.duration_weeks}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="Ex: 2"
                  inputProps={{ step: '1', min: '1', max: '52' }}
                  variant="outlined"
                  size="small"
                  required
                />

                <Divider sx={{ my: 1 }} />

                {/* Categories Selection */}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Categorias (deixe em branco para todas)
                </Typography>
                <FormGroup sx={{ pl: 2 }}>
                  {categoriesOptions.map((category) => (
                    <FormControlLabel
                      key={category}
                      control={
                        <Checkbox
                          checked={formData.categories_included.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          size="small"
                        />
                      }
                      label={category}
                    />
                  ))}
                </FormGroup>

                <Divider sx={{ my: 1 }} />

                {/* Seller IDs Filter */}
                <TextField
                  label="Seller IDs (separados por vírgula)"
                  name="seller_ids_filter"
                  value={formData.seller_ids_filter}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="Ex: SELLER_001, SELLER_002"
                  variant="outlined"
                  size="small"
                  helperText="Deixe em branco para incluir todos"
                  multiline
                  rows={2}
                />

                {/* Error Alert */}
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{
                    mt: 2,
                    backgroundColor: '#EC5A10',
                    color: '#FFF',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': {
                      backgroundColor: '#BF4709',
                    },
                    '&:disabled': {
                      backgroundColor: '#CCC',
                    },
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} sx={{ color: '#FFF' }} />
                      Processando...
                    </Box>
                  ) : (
                    '🚀 Otimizar Campanha'
                  )}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Result Card */}
        {success && result && (
          <Grid item xs={12} lg={7}>
            <Card sx={{ borderRadius: 2, border: '2px solid #2FCC71', backgroundColor: '#F8F9FA' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <CheckCircleIcon sx={{ color: '#2FCC71', fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2FCC71' }}>
                      ✅ Otimização Concluída com Sucesso!
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      ID: {result.optimization_response?.request_id}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Key Metrics */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Paper
                      sx={{
                        p: 1.5,
                        backgroundColor: '#FFF3E0',
                        borderRadius: 1,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                        GMV Total
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#EC5A10', fontWeight: 700 }}>
                        R$
                        {(result.optimization_response?.summary_metrics?.total_expected_gmv || 0).toLocaleString('pt-BR', {
                          maximumFractionDigits: 0,
                        })}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Paper
                      sx={{
                        p: 1.5,
                        backgroundColor: '#E3F2FD',
                        borderRadius: 1,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                        Investimento
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#0047BA', fontWeight: 700 }}>
                        R$
                        {(result.optimization_response?.summary_metrics?.total_expected_rebate_spend || 0).toLocaleString('pt-BR', {
                          maximumFractionDigits: 0,
                        })}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Paper
                      sx={{
                        p: 1.5,
                        backgroundColor: '#F0F4F8',
                        borderRadius: 1,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                        ROI Global
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#2FCC71', fontWeight: 700 }}>
                        {(result.optimization_response?.summary_metrics?.global_predicted_roi * 100).toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Paper
                      sx={{
                        p: 1.5,
                        backgroundColor: '#FCE4EC',
                        borderRadius: 1,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                        TAKE RATE
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#C2185B', fontWeight: 700 }}>
                        R$
                        {(result.optimization_response?.summary_metrics?.expected_take_rate_liquido || 0).toLocaleString('pt-BR', {
                          maximumFractionDigits: 0,
                        })}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Summary Text */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#EC5A10' }}>
                    📋 Resumo da Sugestão:
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 1,
                      maxHeight: 200,
                      overflow: 'auto',
                      borderLeft: '4px solid #EC5A10',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#333', lineHeight: 1.6 }}>
                      {result.summary}
                    </Typography>
                  </Paper>
                </Box>

                {/* Recommendations Table */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#EC5A10' }}>
                    📊 SKUs Recomendados (Preview):
                  </Typography>
                  <TableContainer
                    sx={{ borderRadius: 1, maxHeight: 250, overflow: 'auto', border: '1px solid #E5E5E5' }}
                  >
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#F5F5F5' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, color: '#333' }}>SKU</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#333' }}>Preço Atual</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#333' }}>Preço Sugerido</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#333' }}>ROI</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(result.optimization_response?.recommendations || []).slice(0, 5).map((rec, idx) => (
                          <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#F9F9F9' } }}>
                            <TableCell sx={{ fontSize: '0.85rem' }}>{rec.sku_seller}</TableCell>
                            <TableCell sx={{ fontSize: '0.85rem' }}>
                              R$ {rec.original_price.toFixed(2)}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#EC5A10' }}>
                              R$ {rec.recommended_price_por.toFixed(2)}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.85rem', color: '#2FCC71', fontWeight: 600 }}>
                              {(rec.predicted_sku_roi * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Typography variant="caption" sx={{ color: '#999', mt: 1, display: 'block' }}>
                    Veja todos os {result.optimization_response?.recommendations?.length || 0} SKUs na planilha completa
                  </Typography>
                </Box>

                {/* Download Button */}
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleDownloadResult}
                  startIcon={<DownloadIcon />}
                  sx={{
                    backgroundColor: '#2FCC71',
                    color: '#FFF',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': {
                      backgroundColor: '#27AE60',
                    },
                  }}
                >
                  📥 Baixar Planilha Completa (CSV)
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Info Section */}
      {!success && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ borderRadius: 2, backgroundColor: '#F8F9FA', border: '1px solid #E5E5E5' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  📌 Como Funciona?
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.8 }}>
                  1. Preencha os parâmetros da campanha
                  <br />
                  2. Clique em "Otimizar Campanha"
                  <br />
                  3. Receba a sugestão em segundos
                  <br />
                  4. Baixe a planilha em CSV
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ borderRadius: 2, backgroundColor: '#F8F9FA', border: '1px solid #E5E5E5' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  💡 Dicas
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.8 }}>
                  • Orçamento mín: R$ 100
                  <br />
                  • Duração: 1-52 semanas
                  <br />
                  • Selecione categories específicas para resultados mais focados
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ borderRadius: 2, backgroundColor: '#F8F9FA', border: '1px solid #E5E5E5' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  ⏱️ Próximas Ações
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.8 }}>
                  1. Revise os SKUs sugeridos
                  <br />
                  2. Importe no sistema
                  <br />
                  3. Ative a campanha
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default OptimizationPage;
