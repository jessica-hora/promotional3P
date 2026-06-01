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
} from '@mui/material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
      const data = await fetchHistory(20);
      setHistory(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar histórico. Tente novamente.');
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'processing':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'success':
        return '✅ Sucesso';
      case 'error':
        return '❌ Erro';
      case 'processing':
        return '⏳ Processando';
      default:
        return status;
    }
  };

  const handleDownload = (item) => {
    if (item?.file_content && item?.file_name) {
      downloadCsv(item.file_content, item.file_name);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography
        variant="h4"
        sx={{ mb: 3, fontWeight: 700, color: '#06b6d4' }}
      >
        Histórico de Otimizações
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : history.length === 0 ? (
        <Card sx={{ backgroundColor: '#1e293b', borderRadius: 2 }}>
          <CardContent>
            <Typography sx={{ textAlign: 'center', color: '#94a3b8' }}>
              Nenhuma otimização realizada ainda.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: '#1e293b',
            borderRadius: 2,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#0f172a' }}>
                <TableCell sx={{ fontWeight: 600, color: '#06b6d4' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#06b6d4' }}>Categoria</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#06b6d4' }}>Objetivo</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#06b6d4' }}>Orçamento</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#06b6d4' }}>ROI Estimado</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#06b6d4' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#06b6d4' }}>Data</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#06b6d4' }}>Ação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((item) => (
                <TableRow
                  key={item.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(6, 182, 212, 0.05)',
                    },
                  }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                      }}
                    >
                      {item.id?.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.category || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.objective === 'take_rate' ? 'Maximizar Take Rate' : 'Maximizar GMV'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      R$ {item.budget?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        color: item.estimated_roi >= 1.2 ? '#10b981' : '#f59e0b',
                        fontWeight: 600,
                      }}
                    >
                      {(item.estimated_roi * 100)?.toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(item.status)}
                      color={getStatusColor(item.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      {item.created_at
                        ? format(new Date(item.created_at), 'dd MMM yyyy HH:mm', {
                            locale: ptBR,
                          })
                        : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {item.status === 'success' && item.file_content && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleDownload(item)}
                        sx={{
                          color: '#8b5cf6',
                          borderColor: '#8b5cf6',
                          fontSize: '0.75rem',
                          '&:hover': {
                            borderColor: '#7c3aed',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                          },
                        }}
                      >
                        📥 Baixar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Button
        variant="outlined"
        onClick={loadHistory}
        sx={{
          mt: 3,
          borderColor: '#06b6d4',
          color: '#06b6d4',
          '&:hover': {
            borderColor: '#0891b2',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
          },
        }}
      >
        🔄 Atualizar
      </Button>
    </Box>
  );
};

export default HistoryPage;
