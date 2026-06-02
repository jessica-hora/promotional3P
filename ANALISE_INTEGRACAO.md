# Análise de Integração: Website Frontend ↔ Otimizador

**Data**: 2026-06-01  
**Status**: Fase de Análise Técnica  
**Objetivo**: Integrar a última versão do site frontend com o otimizador em notebook e retornar sugestões em planilha

---

## 📋 Sumário Executivo

O projeto consiste em **dois componentes desacoplados** que precisam ser integrados:

1. **Frontend** (React/Vite): Interface web pronta para consumir API
2. **Otimizador** (Jupyter Notebook): Lógica de optimization em Python/PySpark

A integração requer a **criação de uma API Backend** que exponha a lógica do notebook como serviço HTTP.

---

## 🏗️ Arquitetura Atual

### Frontend (`/frontend/`)

```
Frontend (React 17 + Vite)
  ├── OptimizationPage.jsx (formulário + exibição)
  ├── HistoryPage.jsx (histórico localStorage)
  ├── services/api.js (mock HTTP client)
  └── index.jsx
```

**Fluxo Frontend:**
1. Usuário preenche: orçamento, categoria, objetivo, max_pricing_index, campaign_weeks
2. Chama `optimizeCampaign()` via API mock
3. Recebe resposta com:
   - `summary`: texto descritivo
   - `estimated_roi`: número
   - `file_content`: CSV com recomendações
   - `file_name`: nome do arquivo
4. Salva no localStorage
5. Permite download do CSV

**Limitação Atual**: API é 100% mock (gera dados aleatórios localmente)

---

### Otimizador (`/Otimizador_Atualizado_V4.ipynb`)

```
Notebook (Python + PySpark + BigQuery)
  ├── Imports (pandas, scipy, pyspark, google-cloud)
  ├── Funções de Leitura (Google Sheets, BigQuery, GCS)
  ├── Carregamento de Bases:
  │   ├── Catálogo (produtos)
  │   ├── Elasticidade (pricing causal)
  │   ├── Product Matching
  │   ├── Vendas Captadas
  │   ├── IP (índice de preço vs concorrente)
  │   ├── Estoque
  │   ├── Rebates
  │   ├── Visits (GA4)
  │   └── Preços
  ├── Preparação de Dados
  │   └── Joins finais + filtros
  └── Otimização
      ├── Simulated Annealing
      ├── Cálculo de Demanda
      ├── Métricas Financeiras
      └── Geração de Recomendações
```

**Fluxo Otimizador:**
1. Define parâmetros: `orcamento_rebate`, `categoria`, `MAX_DESCONTO`, `IP_ALVO`
2. Carrega bases de dados do BigQuery/GCS
3. Calcula elasticidade de preço para cada SKU
4. Executa otimização via Simulated Annealing
5. Retorna DataFrame com recomendações de preço/rebate por SKU

**Saída Esperada** (por SKU):
- `sku`: ID do produto
- `current_price`: preço atual
- `suggested_price`: preço recomendado
- `investment`: investimento de rebate
- `estimated_gmv`: GMV estimado
- `incremental_gmv`: GMV incremental

---

## 🔗 Pontos de Integração Necessários

### 1. **Backend API** (CRIAR)

Precisa ser criado um serviço backend que:

```python
# Pseudocódigo
@app.post("/optimize")
def optimize(request: OptimizationRequest):
    """
    request: {
        budget: float,
        category: str,  # "UD" ou "EP"
        objective: str, # "gmv" ou "take_rate"
        max_pricing_index: float,
        campaign_weeks: int
    }
    
    return: {
        summary: str,
        estimated_roi: float,
        file_content: str (CSV),
        file_name: str,
        rows: [{sku, current_price, suggested_price, ...}]
    }
    """
```

**Opções de Implementação:**

| Opção | Vantagens | Desvantagens |
|-------|-----------|-------------|
| **FastAPI** (Python) | Nativo com PySpark, rápido, async | Requer servidor Python |
| **Flask** (Python) | Simples, leve | Menos performático |
| **Streamlit** | Rápido prototipar | Não é típico para API |
| **Google Cloud Functions** | Escalável, serverless | Timeout 9min, ambiente limitado |
| **Docker + uvicorn** | Produção-ready | Complexidade de deploy |

**Recomendação**: **FastAPI + Docker** para desenvolvimento, depois considerar Cloud Functions ou Cloud Run

### 2. **Wrapper do Notebook**

Extrair a lógica de otimização do notebook para um módulo Python reutilizável:

```python
# arquivo: backend/optimizers/promotional_optimizer.py

class PromotionalOptimizer:
    def __init__(self, bigquery_client, gs_creds):
        self.bq = bigquery_client
        self.gs_creds = gs_creds
    
    def optimize(self, category, budget, max_pricing_index, 
                 campaign_weeks, objective):
        # Carrega dados
        catalog = self._load_catalog()
        elasticity = self._load_elasticity()
        sales = self._load_sales()
        # ... mais carregamentos
        
        # Executa Simulated Annealing
        results = self._run_simulated_annealing(
            budget, max_pricing_index, objective
        )
        
        return results  # DataFrame
```

### 3. **Conexão Frontend ↔ Backend**

Modificar `frontend/src/services/api.js`:

```javascript
// De:
const optimizeCampaign = async (params) => {
    // Mock - gera dados aleatórios localmente
}

// Para:
const optimizeCampaign = async (params) => {
    const response = await fetch('http://backend:8000/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    return await response.json();
}
```

### 4. **Persistência de Histórico**

Três estratégias:

| Opção | Melhor Para |
|-------|-----------|
| **localStorage** (atual) | Prototipagem, <50 registros |
| **PostgreSQL/MongoDB** | Produção, histórico persistente |
| **Google Sheets** (via gspread) | Relatórios automáticos |

**Recomendação**: PostgreSQL para backend + localStorage no frontend (fallback)

### 5. **Tratamento de Timeouts**

O notebook é pesado (PySpark, BigQuery, múltiplos joins):
- **Timeout esperado**: 5-15 minutos
- **Solução**: 
  - Implementar job async com polling
  - Usar Celery + Redis para fila de jobs
  - WebSocket para notificação de conclusão

```javascript
// Frontend: polling de status
async function waitForOptimization(jobId, maxWait = 900000) {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWait) {
        const status = await fetch(`/api/jobs/${jobId}`).then(r => r.json());
        if (status.state === 'COMPLETED') return status.result;
        if (status.state === 'FAILED') throw new Error(status.error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll a cada 5s
    }
    throw new Error('Timeout');
}
```

---

## 📊 Dependências e Configuração

### Backend

```
Python 3.9+
├── fastapi (ou flask)
├── pyspark >= 3.0
├── google-cloud-bigquery
├── google-cloud-storage
├── gspread
├── pandas
├── scipy
├── statsmodels
├── pydantic (validação)
├── celery (opcional, para async)
├── redis (opcional, para cache)
└── sqlalchemy + psycopg2 (opcional, para DB)
```

### Frontend

Já está correto:
```json
{
  "@mui/material": "^5.14.9",
  "react": "^17.0.2",
  "react-router-dom": "^5.3.4"
}
```

---

## 🎯 Plano de Implementação (Fases)

### **Fase 1: MVP Backend** (2-3 semanas)
- [x] Entender lógica do notebook
- [ ] Refatorar notebook → módulo Python
- [ ] Criar FastAPI com 1 endpoint `/optimize`
- [ ] Docker local + docker-compose
- [ ] Testes com dados reais

### **Fase 2: Integração Frontend** (1 semana)
- [ ] Atualizar `api.js` para chamar backend real
- [ ] Ajustar UI para mostrar loading de longa duração
- [ ] Tratamento de erros HTTP
- [ ] Timeout warnings

### **Fase 3: Histórico Persistente** (1 semana)
- [ ] Criar banco de dados (PostgreSQL)
- [ ] Endpoint `/history` para listar requisições
- [ ] Deletar requisição
- [ ] Reexecutar requisição anterior

### **Fase 4: Produção & Scaling** (2 semanas)
- [ ] Deploy em Cloud Run / Cloud Functions
- [ ] CI/CD (GitHub Actions)
- [ ] Autenticação (se necessário)
- [ ] Rate limiting
- [ ] Monitoring & Logging

---

## 📈 Fluxo de Dados Completo (Final)

```
┌─────────────────────┐
│  Browser/Frontend   │
│  OptimizationPage   │
└──────────┬──────────┘
           │
           │ POST /api/optimize
           │ { budget, category, ... }
           │
    ┌──────▼──────────┐
    │   FastAPI       │
    │   Backend       │
    │   (Python)      │
    └──────┬──────────┘
           │
      ┌────┴─────────┬──────────────┬──────────────┐
      │              │              │              │
   ┌──▼──┐    ┌─────▼──┐    ┌──────▼──┐    ┌─────▼──┐
   │ BQ  │    │  GCS   │    │ Sheets  │    │  DB    │
   │Data │    │  Files │    │(Input)  │    │(Cache) │
   └─────┘    └────────┘    └─────────┘    └────────┘
           │
      Simulated Annealing
      Calculation
           │
    ┌──────▼──────────┐
    │  Resultados     │
    │  (DataFrame)    │
    └──────┬──────────┘
           │
           │ JSON response
           │ + CSV file
           │
    ┌──────▼─────────┐
    │ Frontend       │
    │ - Display      │
    │ - Save History │
    │ - Download CSV │
    └────────────────┘
```

---

## ⚠️ Considerações e Riscos

| Risco | Impacto | Mitigação |
|-------|--------|-----------|
| Lógica notebook é complexa | Alto | Testes extensivos, documentação clara |
| BigQuery/GCS credenciais | Alto | Usar service accounts + Secrets Manager |
| Timeout de requisições | Alto | Async jobs + polling ou WebSocket |
| Dados desatualizados | Médio | Cache com TTL, refresh schedule |
| Custos BigQuery | Médio | Monitorar queries, adicionar limites |

---

## 📋 Checklist de Integração

- [ ] Backend API criado e testado
- [ ] Wrapper notebook → Python module
- [ ] Frontend conectado ao backend real
- [ ] Histórico persistido em DB
- [ ] Tratamento de erros e timeouts
- [ ] Autenticação (se necessário)
- [ ] Deploy em produção
- [ ] Monitoramento e alertas
- [ ] Documentação completa
- [ ] Testes automatizados

---

## 📁 Estrutura Recomendada do Repositório (Pós-Integração)

```
promotional3P/
├── backend/                     # Novo
│   ├── app.py                   # FastAPI app
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.example
│   └── optimizers/
│       ├── promotional.py       # Lógica do notebook
│       ├── models.py           # Pydantic models
│       └── utils.py            # Funções auxiliares
├── frontend/                    # Existente
│   ├── src/
│   └── package.json
├── docs/                        # Documentação
├── Otimizador_Atualizado_V4.ipynb  # Manter para referência
└── .github/workflows/
    └── deploy.yml              # CI/CD
```

---

## 🚀 Próximas Ações Recomendadas

1. **Priorizar Fase 1**: Refatorar notebook em módulo Python reutilizável
2. **Escolher stack backend**: FastAPI + PostgreSQL + Docker
3. **Setup inicial**: Criar estrutura de pasta + boilerplate
4. **Testes com dados**: Validar que otimizador funciona fora do notebook
5. **Documentar interfaces**: OpenAPI docs para facilitar integração

---

## 📞 Perguntas Abertas

- [ ] Precisa autenticação de usuário?
- [ ] Qual é o SLA esperado para resposta?
- [ ] Precisa suportar múltiplos usuários simultâneos?
- [ ] Dados de input vêm de arquivo Excel ou API?
- [ ] Saída precisa ir para planilha Google Sheets automaticamente?
