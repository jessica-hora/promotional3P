# Plano Técnico: Integração Frontend ↔ Otimizador

**Objetivo**: Conectar a interface React com a lógica do Jupyter Notebook através de uma API Backend

---

## Fase 1: Refatoração do Notebook

### 1.1 Extrair Lógica do Notebook

**Arquivo**: `backend/optimizers/promotional.py`

```python
"""
Módulo de otimização promocional
Extrai a lógica do Jupyter Notebook para reutilização em API
"""

from dataclasses import dataclass
from typing import Dict, List, Tuple
import pandas as pd
import numpy as np
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from google.cloud import bigquery, storage
import gspread

@dataclass
class OptimizationRequest:
    """Modelo de requisição de otimização"""
    budget: float
    category: str  # "UD" ou "EP"
    objective: str  # "gmv" ou "take_rate"
    max_pricing_index: float = 1.0
    campaign_weeks: int = 4

@dataclass
class OptimizationConfig:
    """Configuração do otimizador"""
    orcamento_rebate: float
    orcamento_diario: float
    max_desconto: float
    ip_alvo: float
    categoria: str
    max_iteracoes: int = 5000
    temperatura_inicial: float = 100.0

class PromotionalOptimizer:
    """Classe principal do otimizador"""
    
    def __init__(self, bq_client=None, gcs_client=None):
        self.bq = bq_client or bigquery.Client()
        self.gcs = gcs_client or storage.Client()
        self.spark = SparkSession.builder.appName("promo_opt").getOrCreate()
    
    def optimize(self, request: OptimizationRequest) -> Dict:
        """
        Executa otimização completa
        
        Args:
            request: OptimizationRequest com parâmetros
            
        Returns:
            {
                'status': 'SUCCESS',
                'summary': str,
                'estimated_roi': float,
                'rows': List[Dict],  # SKUs com recomendações
                'file_content': str,  # CSV
                'metadata': {
                    'execution_time': float,
                    'total_skus': int,
                    'optimization_algorithm': str
                }
            }
        """
        try:
            # Step 1: Carregar dados
            print(f"[1/5] Carregando dados da categoria {request.category}...")
            catalog = self._load_catalog(request.category)
            elasticity = self._load_elasticity()
            sales = self._load_sales(request.category)
            prices = self._load_prices()
            inventory = self._load_inventory()
            
            # Step 2: Preparar bases
            print("[2/5] Preparando bases...")
            df_base = self._join_bases(
                catalog, elasticity, sales, prices, inventory
            )
            
            # Step 3: Calcular demanda
            print("[3/5] Calculando elasticidade e demanda...")
            df_demands = self._calculate_demands(
                df_base, request.objective
            )
            
            # Step 4: Otimizar alocação de rebate
            print("[4/5] Executando Simulated Annealing...")
            config = OptimizationConfig(
                orcamento_rebate=request.budget,
                orcamento_diario=request.budget / request.campaign_weeks / 7,
                max_desconto=0.10,
                ip_alvo=0.98,
                categoria=request.category,
            )
            results_opt = self._simulated_annealing(df_demands, config)
            
            # Step 5: Gerar relatório
            print("[5/5] Gerando relatório...")
            output = self._generate_output(results_opt, request)
            
            return {
                'status': 'SUCCESS',
                'summary': output['summary'],
                'estimated_roi': output['estimated_roi'],
                'rows': output['rows'],
                'file_content': output['csv_content'],
                'file_name': output['file_name'],
                'metadata': output['metadata']
            }
            
        except Exception as e:
            return {
                'status': 'ERROR',
                'error': str(e),
                'estimated_roi': 0.0,
                'rows': []
            }
    
    def _load_catalog(self, category: str) -> object:
        """Carrega catálogo de produtos"""
        # Implementação: usar `read_df` do notebook
        pass
    
    def _load_elasticity(self) -> object:
        """Carrega coeficientes de elasticidade"""
        pass
    
    def _load_sales(self, category: str) -> object:
        """Carrega vendas histórias"""
        pass
    
    def _load_prices(self) -> object:
        """Carrega preços atuais"""
        pass
    
    def _load_inventory(self) -> object:
        """Carrega estoque"""
        pass
    
    def _join_bases(self, *dfs) -> object:
        """Faz joins das bases de dados"""
        pass
    
    def _calculate_demands(self, df: object, objective: str) -> object:
        """Calcula demanda estimada por elasticidade"""
        pass
    
    def _simulated_annealing(self, df: object, config: OptimizationConfig) -> Dict:
        """Executa algoritmo de otimização"""
        # Implementação: adaptar o Simulated Annealing do notebook
        pass
    
    def _generate_output(self, results: Dict, request: OptimizationRequest) -> Dict:
        """Gera sumário e arquivo CSV"""
        rows = []
        total_investment = 0
        total_gmv = 0
        
        for sku_id, optimization in results['optimizations'].items():
            row = {
                'sku': sku_id,
                'current_price': optimization['preco_por'],
                'suggested_price': optimization['preco_sugerido'],
                'investment': optimization['rebate_sugerido'],
                'estimated_gmv': optimization['gmv_estimado'],
                'incremental_gmv': optimization['gmv_incremento'],
            }
            rows.append(row)
            total_investment += row['investment']
            total_gmv += row['estimated_gmv']
        
        estimated_roi = (
            (total_gmv - total_investment) / total_investment
            if total_investment > 0 else 0
        )
        
        # Gerar CSV
        df_csv = pd.DataFrame(rows)
        csv_content = df_csv.to_csv(index=False, sep=';')
        
        summary = f"""
        Sugestão gerada para categoria {request.category} 
        com orçamento de R${request.budget:,.2f}.
        GMV estimado: R${total_gmv:,.2f}
        Investimento total: R${total_investment:,.2f}
        ROI projetado: {estimated_roi*100:.1f}%
        Objetivo: {'Maximizar GMV' if request.objective == 'gmv' else 'Maximizar Take Rate'}
        """
        
        return {
            'summary': summary.strip(),
            'estimated_roi': estimated_roi,
            'rows': rows,
            'csv_content': csv_content,
            'file_name': f"sugestoes_{request.category}_otimizadas.csv",
            'metadata': {
                'execution_time': 0.0,
                'total_skus': len(rows),
                'optimization_algorithm': 'Simulated Annealing'
            }
        }
```

---

## Fase 2: Criar Backend API

### 2.1 FastAPI Application

**Arquivo**: `backend/app.py`

```python
"""
API Backend para Otimizador de Campanhas Promocionais
Fornece endpoints para otimização e histórico
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import uuid
from datetime import datetime
import logging

from optimizers.promotional import (
    PromotionalOptimizer,
    OptimizationRequest as OptimizerRequest
)

# Configuração logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==============================
# Pydantic Models
# ==============================

class OptimizationRequest(BaseModel):
    """Request body para otimização"""
    budget: float = Field(..., gt=100, description="Orçamento em R$")
    category: str = Field(..., regex="^(UD|EP)$", description="Categoria: UD ou EP")
    objective: str = Field("gmv", regex="^(gmv|take_rate)$")
    max_pricing_index: float = Field(1.0, gt=0)
    campaign_weeks: int = Field(4, ge=1, le=52)

class OptimizationResponse(BaseModel):
    """Response da otimização"""
    id: str
    status: str  # SUCCESS, ERROR, PROCESSING
    summary: str
    estimated_roi: float
    rows: List[dict]
    file_content: str
    file_name: str
    created_at: str
    execution_time: float = 0.0

class HistoryItem(BaseModel):
    """Item do histórico"""
    id: str
    category: str
    budget: float
    objective: str
    status: str
    created_at: str
    estimated_roi: float
    error_message: Optional[str] = None

# ==============================
# FastAPI App
# ==============================

app = FastAPI(
    title="Promotional Campaign Optimizer API",
    version="1.0.0",
    description="API para otimização de campanhas promocionais 3P"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instanciar otimizador
optimizer = PromotionalOptimizer()

# In-memory job store (para produção, usar Redis/Celery)
jobs_store: dict = {}
history_store: list = []

# ==============================
# Endpoints
# ==============================

@app.get("/health")
def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "optimizer-api"
    }

@app.post("/api/optimize")
def optimize(request: OptimizationRequest, background_tasks: BackgroundTasks):
    """
    Inicia otimização de campanha
    
    - **budget**: Orçamento em reais (mín: R$100)
    - **category**: Categoria (UD ou EP)
    - **objective**: Objetivo (gmv ou take_rate)
    - **max_pricing_index**: Índice máximo de pricing
    - **campaign_weeks**: Duração em semanas
    
    Returns:
    - **id**: ID da requisição para polling
    - **status**: PROCESSING (requisição enfileirada)
    """
    
    job_id = str(uuid.uuid4())
    
    # Salvar no histórico
    history_item = {
        'id': job_id,
        'category': request.category,
        'budget': request.budget,
        'objective': request.objective,
        'status': 'PROCESSING',
        'created_at': datetime.now().isoformat(),
        'estimated_roi': None,
    }
    history_store.append(history_item)
    jobs_store[job_id] = history_item
    
    # Executar em background (em produção: Celery)
    background_tasks.add_task(
        _execute_optimization,
        job_id,
        request
    )
    
    return {
        "job_id": job_id,
        "status": "PROCESSING",
        "message": "Otimização enfileirada. Verifique status usando o job_id"
    }

@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str):
    """
    Obtém status e resultado de um job
    
    Status possíveis:
    - PROCESSING: Ainda executando
    - SUCCESS: Concluído com sucesso
    - ERROR: Falha na execução
    """
    
    if job_id not in jobs_store:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    
    job = jobs_store[job_id]
    
    return {
        "job_id": job_id,
        "status": job['status'],
        "created_at": job['created_at'],
        "estimated_roi": job.get('estimated_roi'),
        "error": job.get('error_message'),
        "result": job.get('result') if job['status'] == 'SUCCESS' else None
    }

@app.get("/api/history")
def get_history(category: Optional[str] = None, limit: int = 50):
    """
    Retorna histórico de requisições
    
    - **category**: Filtrar por categoria (UD ou EP)
    - **limit**: Máximo de registros
    """
    
    items = history_store[-limit:]
    
    if category:
        items = [h for h in items if h['category'] == category]
    
    return {
        "count": len(items),
        "items": items
    }

@app.delete("/api/history/{job_id}")
def delete_history_item(job_id: str):
    """Remove item do histórico"""
    
    global history_store
    
    history_store = [h for h in history_store if h['id'] != job_id]
    
    if job_id in jobs_store:
        del jobs_store[job_id]
    
    return {"status": "deleted", "job_id": job_id}

# ==============================
# Background Tasks
# ==============================

def _execute_optimization(job_id: str, request: OptimizationRequest):
    """Executa otimização em background"""
    
    try:
        logger.info(f"[{job_id}] Iniciando otimização...")
        
        # Executar otimizador
        optimizer_request = OptimizerRequest(
            budget=request.budget,
            category=request.category,
            objective=request.objective,
            max_pricing_index=request.max_pricing_index,
            campaign_weeks=request.campaign_weeks
        )
        
        result = optimizer.optimize(optimizer_request)
        
        # Atualizar job store
        if result['status'] == 'SUCCESS':
            jobs_store[job_id]['status'] = 'SUCCESS'
            jobs_store[job_id]['estimated_roi'] = result['estimated_roi']
            jobs_store[job_id]['result'] = result
        else:
            jobs_store[job_id]['status'] = 'ERROR'
            jobs_store[job_id]['error_message'] = result.get('error', 'Erro desconhecido')
        
        logger.info(f"[{job_id}] Otimização concluída: {result['status']}")
        
    except Exception as e:
        logger.error(f"[{job_id}] Erro durante otimização: {str(e)}")
        jobs_store[job_id]['status'] = 'ERROR'
        jobs_store[job_id]['error_message'] = str(e)

# ==============================
# Error Handlers
# ==============================

@app.exception_handler(Exception)
def global_exception_handler(request, exc):
    """Handler para exceções não tratadas"""
    logger.error(f"Erro não tratado: {str(exc)}")
    return {
        "status": "error",
        "message": str(exc),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 2.2 Dockerfile

**Arquivo**: `backend/Dockerfile`

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Instalar Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy código
COPY . .

# Expor porta
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()"

# Comando
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2.3 Docker Compose

**Arquivo**: `backend/docker-compose.yml`

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - GOOGLE_APPLICATION_CREDENTIALS=/app/credentials.json
      - LOG_LEVEL=INFO
    volumes:
      - ./credentials.json:/app/credentials.json:ro
      - .:/app
    networks:
      - promo_network

  postgres:
    image: postgres:13
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: promotional3p
      POSTGRES_USER: promo_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - promo_network

networks:
  promo_network:
    driver: bridge

volumes:
  postgres_data:
```

---

## Fase 3: Frontend Integration

### 3.1 Atualizar API Service

**Arquivo**: `frontend/src/services/api.js`

```javascript
// Antes: Mock local
// Depois: Real backend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const optimizeCampaign = async (payload) => {
  try {
    // Step 1: Iniciar otimização
    const initialResponse = await fetch(`${API_BASE_URL}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!initialResponse.ok) {
      throw new Error(`HTTP ${initialResponse.status}`);
    }

    const { job_id } = await initialResponse.json();

    // Step 2: Polling até conclusão
    const result = await pollJobCompletion(job_id);

    return result;
  } catch (error) {
    console.error('Optimization error:', error);
    throw new Error(error.message || 'Falha ao processar otimização');
  }
};

const pollJobCompletion = (jobId, maxWait = 900000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 segundos

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
        const data = await response.json();

        if (data.status === 'SUCCESS') {
          resolve(data.result);
        } else if (data.status === 'ERROR') {
          reject(new Error(data.error || 'Erro na otimização'));
        } else if (Date.now() - startTime > maxWait) {
          reject(new Error('Timeout na otimização (máximo 15 min)'));
        } else {
          // Continuar polling
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
};

export { optimizeCampaign };
```

### 3.2 .env Frontend

**Arquivo**: `frontend/.env`

```
REACT_APP_API_URL=http://localhost:8000/api
```

---

## Fase 4: Banco de Dados

### 4.1 Schema PostgreSQL

```sql
CREATE TABLE optimization_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(10) NOT NULL,
    budget DECIMAL(12, 2) NOT NULL,
    objective VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_roi DECIMAL(5, 4),
    error_message TEXT,
    result_summary TEXT,
    csv_content TEXT,
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at DESC)
);

CREATE TABLE optimization_results (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES optimization_history(id),
    sku VARCHAR(50),
    current_price DECIMAL(10, 2),
    suggested_price DECIMAL(10, 2),
    investment DECIMAL(12, 2),
    estimated_gmv DECIMAL(12, 2),
    incremental_gmv DECIMAL(12, 2)
);
```

---

## Resumo: O que implementar

| Arquivo | Descrição | Prioridade |
|---------|-----------|-----------|
| `backend/optimizers/promotional.py` | Classe principal de otimização | 🔴 CRÍTICA |
| `backend/app.py` | API FastAPI | 🔴 CRÍTICA |
| `backend/Dockerfile` | Container | 🟠 ALTA |
| `backend/requirements.txt` | Dependências Python | 🔴 CRÍTICA |
| `frontend/src/services/api.js` | Client HTTP | 🔴 CRÍTICA |
| `frontend/.env` | Configuração frontend | 🟠 ALTA |
| `backend/docker-compose.yml` | Local development | 🟡 MÉDIA |
| PostgreSQL schema | Histórico persistente | 🟠 ALTA |

---

## Testing Checklist

- [ ] Backend API responde a /health
- [ ] POST /api/optimize retorna job_id
- [ ] GET /api/jobs/{job_id} retorna status
- [ ] Frontend consegue fazer polling
- [ ] Download CSV funciona
- [ ] Histórico salva no DB
- [ ] Erro handling funciona
- [ ] Timeout é tratado gracefully
