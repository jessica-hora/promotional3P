# Guia Prático: Começar a Integração (Hoje)

Este documento descreve os passos práticos para iniciar a implementação da integração imediatamente.

---

## ⚡ Quick Start (30 minutos)

### Passo 1: Preparar Estrutura Backend

```bash
# Na pasta do projeto
cd /workspaces/promotional3P

# Criar pasta backend
mkdir -p backend/optimizers
cd backend

# Criar arquivos
touch app.py requirements.txt Dockerfile docker-compose.yml .env
cd optimizers
touch __init__.py promotional.py models.py
touch utils.py
cd ../..
```

### Passo 2: Requisitos Python

**Arquivo**: `backend/requirements.txt`

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
google-cloud-bigquery==3.14.0
google-cloud-storage==2.10.0
gspread==5.12.0
oauth2client==4.1.3
pyspark==3.5.0
pandas==2.1.3
numpy==1.26.2
scipy==1.11.4
statsmodels==0.14.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-dotenv==1.0.0
redis==5.0.1
celery==5.3.4
```

### Passo 3: .env Backend

**Arquivo**: `backend/.env`

```bash
# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json

# Database
DATABASE_URL=postgresql://promo_user:secure_password@localhost:5432/promotional3p

# API
API_PORT=8000
LOG_LEVEL=INFO

# Feature Flags
USE_ASYNC_JOBS=true
CACHE_ENABLED=true
```

### Passo 4: Rodar Localmente

```bash
cd backend

# Instalar dependências
pip install -r requirements.txt

# Validar que BigQuery credentials estão no lugar
# (copiar credentials.json para backend/)

# Rodar servidor
python app.py

# Em outro terminal, testar:
curl http://localhost:8000/health
```

---

## 📝 Template Inicial: `backend/app.py` (Versão Simplificada)

Comece com este template minimalista e expanda incrementalmente:

```python
"""
API Backend - Versão MVP
Conecta frontend ao otimizador
"""

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import uuid
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Optimizer API v1")

# CORS para frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Models
# ============================================

class OptRequest(BaseModel):
    budget: float
    category: str  # UD ou EP
    objective: str  # gmv ou take_rate
    max_pricing_index: float = 1.0
    campaign_weeks: int = 4

# ============================================
# In-Memory Storage (MVP)
# ============================================

jobs = {}

# ============================================
# Endpoints
# ============================================

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/api/optimize")
def start_optimization(req: OptRequest, bg_tasks: BackgroundTasks):
    """Inicia job de otimização"""
    
    job_id = str(uuid.uuid4())
    
    # Salvar job
    jobs[job_id] = {
        "status": "PROCESSING",
        "request": req.dict(),
        "created_at": datetime.now().isoformat(),
    }
    
    # Rodar em background
    bg_tasks.add_task(run_optimization, job_id, req)
    
    return {"job_id": job_id, "status": "PROCESSING"}

@app.get("/api/jobs/{job_id}")
def get_job_status(job_id: str):
    """Retorna status do job"""
    
    if job_id not in jobs:
        return {"error": "Job not found"}, 404
    
    return jobs[job_id]

def run_optimization(job_id: str, req: OptRequest):
    """Simula otimização (depois chamar real optimizer)"""
    
    try:
        logger.info(f"[{job_id}] Iniciando otimização...")
        
        # TODO: Chamar PromotionalOptimizer.optimize(req)
        # Por enquanto, simular:
        import time
        time.sleep(3)  # Simular processamento
        
        # Resultado simulado
        result = {
            "summary": f"Otimização para {req.category} com orçamento R${req.budget}",
            "estimated_roi": 0.25,
            "rows": [
                {
                    "sku": "SKU-001",
                    "current_price": 100.0,
                    "suggested_price": 95.0,
                    "investment": 500.0,
                    "estimated_gmv": 2500.0,
                    "incremental_gmv": 1500.0
                }
            ],
            "file_content": "sku;current_price;suggested_price\nSKU-001;100;95",
            "file_name": f"sugestoes_{req.category}.csv"
        }
        
        # Atualizar job
        jobs[job_id]["status"] = "SUCCESS"
        jobs[job_id]["result"] = result
        
        logger.info(f"[{job_id}] ✓ Concluído com sucesso")
        
    except Exception as e:
        logger.error(f"[{job_id}] ✗ Erro: {str(e)}")
        jobs[job_id]["status"] = "ERROR"
        jobs[job_id]["error"] = str(e)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## 📱 Template: `frontend/src/services/api.js` (Versão Conectada)

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const optimizeCampaign = async (params) => {
  console.log('Calling API with params:', params);
  
  try {
    // Step 1: POST /optimize
    const startResponse = await fetch(`${API_URL}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!startResponse.ok) throw new Error(`HTTP ${startResponse.status}`);
    const { job_id } = await startResponse.json();
    console.log('Job ID:', job_id);

    // Step 2: Poll /jobs/{job_id}
    return await pollUntilComplete(job_id);

  } catch (error) {
    console.error('API Error:', error);
    throw new Error(error.message || 'Erro na API');
  }
};

const pollUntilComplete = (jobId, maxAttempts = 300) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      console.log(`Checking job status... (attempt ${attempts}/${maxAttempts})`);
      
      try {
        const response = await fetch(`${API_URL}/jobs/${jobId}`);
        const data = await response.json();

        if (data.status === 'SUCCESS') {
          clearInterval(interval);
          resolve(data.result);
        } else if (data.status === 'ERROR') {
          clearInterval(interval);
          reject(new Error(data.error));
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error('Timeout'));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 2000); // Check a cada 2 segundos
  });
};

export const downloadCsv = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};
```

---

## 🚀 Passos para Hoje (Priority Order)

### ✅ 1. Setup Básico Backend (30 min)
- [ ] Criar pasta `backend/`
- [ ] Criar `app.py` minimalista com endpoints dummy
- [ ] Rodar localmente com `python app.py`
- [ ] Testar `/health` com curl

### ✅ 2. Conectar Frontend (30 min)
- [ ] Atualizar `api.js` para chamar real backend
- [ ] Rodar frontend com `npm run dev`
- [ ] Testar fluxo completo end-to-end

### ✅ 3. Integrar Notebook (2-4 horas)
- [ ] Refatorar lógica notebook em `optimizers/promotional.py`
- [ ] Testes com dados reais do BigQuery
- [ ] Integrar ao app.py

### ✅ 4. Persistência (2 horas)
- [ ] Setup PostgreSQL local
- [ ] Salvar histórico no DB
- [ ] Endpoint `/history`

---

## 🧪 Testes Rápidos

### Teste Backend Sozinho

```bash
curl -X POST http://localhost:8000/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "budget": 5000,
    "category": "UD",
    "objective": "gmv",
    "max_pricing_index": 1.0,
    "campaign_weeks": 4
  }'

# Vai retornar algo como:
# {"job_id": "abc-123", "status": "PROCESSING"}

# Depois:
curl http://localhost:8000/api/jobs/abc-123
```

### Teste Frontend Local

```bash
cd frontend
npm run dev

# Ir para http://localhost:5173
# Preencher form
# Clicar "Otimizar"
# Verificar console do browser (F12)
```

---

## 📚 Ordem de Arquivos para Editar

```
1️⃣  backend/app.py                    ← Comece aqui
2️⃣  frontend/src/services/api.js      ← Depois aqui
3️⃣  backend/requirements.txt           ← Depois instale
4️⃣  backend/optimizers/promotional.py ← Integre notebook aqui
5️⃣  backend/Dockerfile                ← Deploy depois
```

---

## ⚙️ Variáveis de Ambiente para .env

Mínimas necessárias:
```
# Backend
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
DATABASE_URL=postgresql://promo_user:secure_password@localhost:5432/promotional3p

# Frontend (.env)
REACT_APP_API_URL=http://localhost:8000/api
```

---

## 🔗 Diagrama do Fluxo (ASCII)

```
Browser
   │
   ├─ User preenche form
   ├─ Click "Otimizar"
   │
   ▼
Frontend (React)
   │
   ├─ POST /api/optimize
   │   { budget, category, ... }
   │
   ▼
Backend (FastAPI)
   │
   ├─ Salva job como PROCESSING
   ├─ Retorna job_id
   │
   └─ Background Task:
       │
       ├─ Carrega dados BigQuery
       ├─ Executa Simulated Annealing
       ├─ Atualiza job → SUCCESS
       │
       ▼
Frontend (Polling)
   │
   ├─ GET /api/jobs/{job_id}
   ├─ Status == SUCCESS?
   ├─ SIM → Mostra resultado + Download CSV
   ├─ NÃO → Aguarda 2s e retry
   │
   ▼
LocalStorage + History
```

---

## 🆘 Troubleshooting Comum

| Problema | Solução |
|----------|---------|
| CORS error | Verificar `allow_origins` no FastAPI |
| Job fica em PROCESSING | Verificar logs do backend, pode estar travado |
| Timeout 504 | Normal para notebook pesado, implementar polling |
| API retorna 404 | Verificar URL base em `api.js` |
| Credentials error | Garantir `credentials.json` existe no `backend/` |

---

## 📊 Checklist de Conclusão da Integração

- [ ] Backend responde em /health
- [ ] Frontend consegue chamar backend
- [ ] Job é criado e salvo em memory
- [ ] Polling funciona
- [ ] Resultado é retornado ao frontend
- [ ] CSV é downloadado
- [ ] Histórico é salvo
- [ ] Erros são tratados gracefully
- [ ] Timeout não trava aplicação

---

## 📞 Próximos Passos Recomendados

**Hoje/Amanhã:**
1. Criar `backend/app.py` minimalista
2. Testar conexão frontend-backend
3. Simular resposta completa

**Próximos 3 dias:**
1. Refatorar notebook em módulo Python
2. Integrar ao app.py
3. Testar com dados reais

**Próxima semana:**
1. Adicionar PostgreSQL
2. Deploy em staging
3. Load testing

---

**Status**: 🟡 Pronto para Iniciar  
**Tempo Estimado Total**: 1-2 semanas  
**Complexidade**: Média-Alta
