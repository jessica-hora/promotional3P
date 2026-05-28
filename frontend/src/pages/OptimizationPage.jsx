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
} from '@maas-components/core';
import { apiClient } from '../services/api';

const OptimizationPage = () => {
  const [formData, setFormData] = useState({
    budget: '',
    category: 'UD',
    maxPricingIndex: '1.0',
    campaignWeeks: '4',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState(null);
  const [timeWarning, setTimeWarning] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.budget) {
      errors.push('Orçamento é obrigatório');
    } else if (parseFloat(formData.budget) < 100) {
      errors.push('Orçamento mínimo é R$ 100');
    }

    if (!formData.category) {
      errors.push('Categoria é obrigatória');
    }

    if (!formData.campaignWeeks || parseInt(formData.campaignWeeks) < 1) {
      errors.push('Semanas da campanha deve ser >= 1');
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
    setTimeWarning(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    // Timeout warning after 10 minutes
    const timeoutWarning = setTimeout(() => {
      setTimeWarning(true);
    }, 600000);

    try {
      const response = await apiClient.post('/api/v1/optimize', {
        budget: parseFloat(formData.budget),
        category: formData.category,
        max_pricing_index: parseFloat(formData.maxPricingIndex),
        campaign_weeks: parseInt(formData.campaignWeeks),
      });

      setResult(response.data);
      setSuccess(true);
      setFormData({
        budget: '',
        category: 'UD',
        maxPricingIndex: '1.0',
        campaignWeeks: '4',
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Erro ao processar otimização. Tente novamente.'
      );
      console.error('Optimization error:', err);
    } finally {
      clearTimeout(timeoutWarning);
      setLoading(false);
    }
  };

  const handleDownloadResult = () => {
    if (result?.file_url) {
      const link = document.createElement('a');
      link.href = result.file_url;
      link.click();
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography
        variant="h4"
        sx={{ mb: 3, fontWeight: 700, color: '#06b6d4' }}
      >
        Otimizador de Campanhas Promocionais
      </Typography>

      <Grid container spacing={3}>
        {/* Form Card */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              backgroundColor: '#1e293b',
              borderRadius: 2,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Parâmetros da Campanha
              </Typography>

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Budget Field */}
                <TextField
                  label="Orçamento (R$)"
                  name="budget"
                  type="number"
                  value={formData.budget}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="Ex: 5000"
                  inputProps={{ step: '100', min: '100' }}
                  variant="outlined"
                  required
                />

                {/* Category Field */}
                <TextField
                  label="Categoria de Produtos"
                  name="category"
                  select
                  value={formData.category}
                  onChange={handleInputChange}
                  SelectProps={{
                    native: true,
                  }}
                  fullWidth
                  variant="outlined"
                  required
                >
                  <option value="UD">UD - Utilidades Domésticas</option>
                  <option value="EP">EP - Eletrônicos e Periféricos</option>
                  <option value="MODA">Moda</option>
                  <option value="LIVROS">Livros</option>
                </TextField>

                {/* Max Pricing Index */}
                <TextField
                  label="Máximo Índice de Preço"
                  name="maxPricingIndex"
                  type="number"
                  value={formData.maxPricingIndex}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="Ex: 1.0"
                  inputProps={{ step: '0.1', min: '0' }}
                  variant="outlined"
                />

                {/* Campaign Weeks */}
                <TextField
                  label="Duração da Campanha (semanas)"
                  name="campaignWeeks"
                  type="number"
                  value={formData.campaignWeeks}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="Ex: 4"
                  inputProps={{ step: '1', min: '1', max: '52' }}
                  variant="outlined"
                  required
                />

                {/* Error Alert */}
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}

                {/* Time Warning Alert */}
                {timeWarning && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    A otimização está demorando mais que o esperado (10+ minutos).
                    Você pode aguardar ou tentar novamente.
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
                    backgroundColor: '#06b6d4',
                    color: '#0f172a',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#0891b2',
                    },
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} />
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
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                backgroundColor: '#1e293b',
                borderRadius: 2,
                borderLeft: '4px solid #10b981',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ mb: 2, fontWeight: 600, color: '#10b981' }}
                >
                  ✅ Otimização Concluída
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                    ID da Requisição:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontFamily: 'monospace',
                      backgroundColor: '#0f172a',
                      p: 1,
                      borderRadius: 1,
                      fontSize: '0.85rem',
                    }}
                  >
                    {result.request_id}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                    ROI Estimado:
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: '#06b6d4',
                      fontWeight: 700,
                    }}
                  >
                    {(result.estimated_roi * 100).toFixed(1)}%
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                    Resumo da Sugestão:
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: '#0f172a',
                      borderRadius: 1,
                      maxHeight: 150,
                      overflow: 'auto',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {result.summary}
                    </Typography>
                  </Paper>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleDownloadResult}
                  sx={{
                    backgroundColor: '#8b5cf6',
                    color: '#fff',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#7c3aed',
                    },
                  }}
                >
                  📥 Baixar Planilha de Resultados
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default OptimizationPage;
