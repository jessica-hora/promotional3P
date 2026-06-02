import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  LinearProgress,
} from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import { fetchHistory, downloadCsv } from '../services/api';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await fetchHistory(50);
      setHistory(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar histórico. Tente novamente.');
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getExpirationInfo = (createdAt) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
    const elapsed = now - created;
    const remaining = expirationTime - elapsed;

    return {
      percentageRemaining: Math.max(0, (remaining / expirationTime) * 100),
      isExpired: remaining <= 0,
      timeRemaining: remaining > 0 ? formatDistanceToNow(now + remaining, { locale: ptBR }) : '0s',
    };
  };

  const handleDownload = (item) => {
    if (item?.file_content && item?.file_name) {
      downloadCsv(item.file_content, item.file_name);
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
            📋 Histórico de Otimizações
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Todas as solicitações permanecem disponíveis para download por até 24 horas
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={loadHistory}
          disabled={loading}
          sx={{
            backgroundColor: '#EC5A10',
            color: '#FFF',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#BF4709',
            },
          }}
        >
          Atualizar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={48} />
        </Box>
      ) : history.length === 0 ? (
        <Card sx={{ borderRadius: 2, backgroundColor: '#F8F9FA', border: '1px solid #E5E5E5' }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#999' }}>
              📭 Nenhuma otimização realizada ainda
            </Typography>
            <Typography variant="body2" sx={{ color: '#999' }}>
              Quando você solicitar uma otimização, o histórico aparecerá aqui.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #E5E5E5',
            overflow: 'auto',
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F5F5F5', borderBottom: '2px solid #E5E5E5' }}>
                <TableCell sx={{ fontWeight: 700, color: '#333', width: '15%' }}>
                  ID da Requisição
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#333', width: '12%' }}>
                  Objetivo
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#333', width: '12%' }}>
                  Orçamento
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#333', width: '10%' }}>
                  ROI Global
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#333', width: '12%' }}>
                  GMV Esperado
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#333', width: '15%' }}>
                  Expiração em 24h
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#333', width: '12%' }}>
                  Data
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#333', width: '12%' }}>
                  Ação
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((item, idx) => {
                const expiration = getExpirationInfo(item.created_at);
                const responseData = item.response_data || {};
                const metrics = responseData.summary_metrics || {};

                return (
                  <TableRow
                    key={idx}
                    sx={{
                      borderBottom: '1px solid #E5E5E5',
                      '&:hover': {
                        backgroundColor: '#F9F9F9',
                      },
                      opacity: expiration.isExpired ? 0.5 : 1,
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          color: '#EC5A10',
                          fontWeight: 600,
                        }}
                      >
                        {item.request_payload?.optimization_request?.request_id?.substring(0, 12)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.request_payload?.optimization_request?.parameters?.objective === 'MAX_TAKE_RATE_LIQUIDO'
                          ? 'Take Rate'
                          : 'GMV'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        R${' '}
                        {(item.request_payload?.optimization_request?.parameters?.budget_limit_reais || 0).toLocaleString(
                          'pt-BR',
                          { minimumFractionDigits: 0, maximumFractionDigits: 0 }
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: metrics.global_predicted_roi >= 2 ? '#2FCC71' : '#F39C12',
                        }}
                      >
                        {(metrics.global_predicted_roi * 100).toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        R${' '}
                        {(metrics.total_expected_gmv || 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ width: '100%', px: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={expiration.percentageRemaining}
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#E5E5E5',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: expiration.isExpired ? '#E74C3C' : '#2FCC71',
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.7rem',
                            color: expiration.isExpired ? '#E74C3C' : '#666',
                            fontWeight: 600,
                          }}
                        >
                          {expiration.isExpired ? '⏰ Expirado' : `${expiration.percentageRemaining.toFixed(0)}%`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontSize: '0.8rem', color: '#666' }}>
                        {format(new Date(item.created_at), 'dd MMM HH:mm', { locale: ptBR })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {!expiration.isExpired && item.file_content ? (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownload(item)}
                          sx={{
                            backgroundColor: '#2FCC71',
                            color: '#FFF',
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            '&:hover': {
                              backgroundColor: '#27AE60',
                            },
                          }}
                        >
                          Baixar
                        </Button>
                      ) : (
                        <Chip
                          label="Expirado"
                          size="small"
                          sx={{
                            backgroundColor: '#FFE5E5',
                            color: '#E74C3C',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Info Cards */}
      {history.length > 0 && (
        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, backgroundColor: '#F8F9FA', border: '1px solid #E5E5E5' }}>
              <CardContent>
                <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                  Total de Solicitações
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#EC5A10' }}>
                  {history.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, backgroundColor: '#F8F9FA', border: '1px solid #E5E5E5' }}>
              <CardContent>
                <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                  Arquivos Disponíveis
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2FCC71' }}>
                  {history.filter((h) => !getExpirationInfo(h.created_at).isExpired && h.file_content).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, backgroundColor: '#F8F9FA', border: '1px solid #E5E5E5' }}>
              <CardContent>
                <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                  Orçamento Total
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0047BA' }}>
                  R$
                  {history
                    .reduce(
                      (sum, h) =>
                        sum +
                        (h.request_payload?.optimization_request?.parameters?.budget_limit_reais || 0),
                      0
                    )
                    .toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 2, backgroundColor: '#F8F9FA', border: '1px solid #E5E5E5' }}>
              <CardContent>
                <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                  GMV Total Esperado
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#F39C12' }}>
                  R$
                  {history
                    .reduce(
                      (sum, h) => sum + (h.response_data?.summary_metrics?.total_expected_gmv || 0),
                      0
                    )
                    .toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default HistoryPage;
