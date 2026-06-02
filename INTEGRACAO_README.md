# 🚀 Integração Frontend + Otimizador: Documentação Completa

## 📍 Visão Geral

Este repositório contém uma **análise completa** e **plano de implementação** para integrar:

- **Frontend** (React/Vite) - Interface web para otimização
- **Otimizador** (Jupyter Notebook) - Lógica de otimização em Python/PySpark
- **Backend API** (FastAPI) - Conector entre os dois

---

## 📚 Documentos de Referência

Criados em **2026-06-01** com análise técnica completa.

### 1. 📖 **SUMARIO_EXECUTIVO.md** ← **COMECE AQUI**
   - **Para**: Gerentes, Product Owners, Stakeholders
   - **Conteúdo**: Visão geral, ROI, timeline, decisões
   - **Leitura**: ~10 min
   - **Recomendação**: Ler primeira para entender contexto

### 2. 🔧 **ANALISE_INTEGRACAO.md**
   - **Para**: Arquitetos, Tech Leads
   - **Conteúdo**: Análise detalhada, riscos, mitigações, checklist
   - **Leitura**: ~30 min
   - **Recomendação**: Ler antes de começar dev

### 3. 🏗️ **PLANO_TECNICO.md**
   - **Para**: Engenheiros Backend, Data Scientists
   - **Conteúdo**: Código pronto (Python), arquitetura, banco de dados
   - **Leitura**: ~60 min (+ tempo para implementar)
   - **Recomendação**: Usar como referência durante dev

### 4. ⚡ **GUIA_PRATICO.md**
   - **Para**: Desenvolvedores que vão codar
   - **Conteúdo**: Quick start, templates, testes, troubleshooting
   - **Leitura**: ~20 min
   - **Recomendação**: Usar quando começar a programar

---

## 🎯 Começar Agora

### Para Stakeholders (Decision Makers)
1. Ler [SUMARIO_EXECUTIVO.md](SUMARIO_EXECUTIVO.md)
2. Validar stack tecnológico
3. Aprovar timeline (2 semanas)
4. Alocar recursos

### Para Tech Lead
1. Ler [ANALISE_INTEGRACAO.md](ANALISE_INTEGRACAO.md)
2. Revisar [PLANO_TECNICO.md](PLANO_TECNICO.md)
3. Criar backlog
4. Kickoff com time

### Para Desenvolvedores
1. Ler [GUIA_PRATICO.md](GUIA_PRATICO.md)
2. Executar Quick Start (30 min)
3. Criar estrutura backend
4. Conectar frontend
5. Integrar notebook

---

## 🏗️ Arquitetura (Resumido)

```
┌──────────────────────────────────────────────┐
│                  FRONTEND                    │
│  React + Vite (já existe)                   │
│  - OptimizationPage                          │
│  - HistoryPage                               │
│  - Material-UI                               │
└────────────┬─────────────────────────────────┘
             │
             │ HTTP REST API
             │ (novo)
             │
┌────────────▼─────────────────────────────────┐
│               BACKEND (FastAPI)              │
│  - POST /api/optimize                        │
│  - GET /api/jobs/{id}                        │
│  - GET /api/history                          │
│  - Async job processing                      │
│  - PostgreSQL persistence                    │
└────────────┬─────────────────────────────────┘
             │
             │ Refactored Python
             │
┌────────────▼─────────────────────────────────┐
│           OPTIMIZER (Python Module)          │
│  Extraído do Jupyter Notebook                │
│  - PromotionalOptimizer class                │
│  - Simulated Annealing algorithm             │
│  - BigQuery integration                      │
│  - Elasticity calculations                   │
└────────────┬─────────────────────────────────┘
             │
     ┌───────┼────────┐
     │       │        │
  ┌──▼──┐ ┌─▼───┐ ┌──▼────┐
  │ BQ  │ │ GCS │ │Sheets │
  └─────┘ └─────┘ └───────┘
```

---

## 📋 Timeline Recomendada

```
SEMANA 1:
├─ Seg-Ter: Backend API MVP
│  ├─ Setup FastAPI
│  ├─ Endpoints básicos
│  ├─ Teste /health
│  └─ Teste POST /optimize
│
├─ Qua: Frontend Integration
│  ├─ Atualizar api.js
│  ├─ Teste end-to-end
│  └─ Ajustar UI para loading
│
└─ Qui-Sex: Notebook Refactoring
   ├─ Extrair lógica
   ├─ Criar PromotionalOptimizer
   ├─ Integrar ao app.py
   └─ Teste com dados reais

SEMANA 2:
├─ Seg-Ter: PostgreSQL + Histórico
│  ├─ Schema DB
│  ├─ ORM setup
│  └─ Endpoints /history
│
├─ Qua-Qui: Deploy + Testing
│  ├─ Dockerfile
│  ├─ docker-compose
│  ├─ CI/CD setup
│  └─ Load testing
│
└─ Sex: Documentação + Review
   ├─ API docs
   ├─ Runbooks
   └─ Handoff
```

---

## 🔄 Fluxo de Dados Completo

```
User (Browser)
  │
  ├─ 1. Preenche formulário
  │     budget: 5000
  │     category: "UD"
  │     objective: "gmv"
  │
  └─ 2. POST /api/optimize
       │
       ▼
Backend
  │
  ├─ 3. Cria job em PROCESSING
  ├─ 4. Retorna job_id ao frontend
  │
  └─ 5. Background task:
       ├─ Carrega dados BigQuery
       ├─ Executa otimização (3-15 min)
       └─ Salva resultado em DB
       │
       └─ Status: SUCCESS
            │
            ├─ summary: "Sugestão para UD..."
            ├─ estimated_roi: 0.25
            ├─ rows: [...]
            └─ csv_content: "sku;price;..."
       │
Frontend (Polling)
  │
  ├─ 6. GET /api/jobs/{job_id}
  │     Status: PROCESSING
  │
  ├─ 7. [Aguarda 2s]
  │
  ├─ 8. GET /api/jobs/{job_id}
  │     Status: PROCESSING
  │
  └─ 9. GET /api/jobs/{job_id}
        Status: SUCCESS
        │
        ▼
UI
  │
  ├─ 10. Exibe sumário
  ├─ 11. Mostra tabela com SKUs
  ├─ 12. Botão "Download CSV"
  └─ 13. Salva em histórico localStorage
```

---

## 🔗 Dependências

### Backend Python
```
fastapi
uvicorn
pydantic
google-cloud-bigquery
pyspark
pandas
scipy
sqlalchemy
psycopg2-binary
```

### Frontend (já existe)
```
react 17
material-ui 5
vite
```

### Database
```
PostgreSQL 13+
```

### DevOps
```
Docker
docker-compose
```

---

## ✅ Checklist Rápido

Antes de começar:

- [ ] Entender arquitetura (ler docs)
- [ ] Confirmar timeline com stakeholder
- [ ] Alocar dev backend
- [ ] Setup credenciais BigQuery/GCS
- [ ] Setup PostgreSQL local
- [ ] Criar estrutura de pastas backend/
- [ ] Rodar `pip install -r requirements.txt`
- [ ] Testar `/health` endpoint
- [ ] Conectar frontend a backend

---

## 🆘 Problemas Comuns

| Problema | Solução |
|----------|---------|
| **CORS error** | Verificar `allow_origins` em FastAPI |
| **Timeout na otimização** | Normal! Usar polling + async jobs |
| **BigQuery auth fail** | Copiar credentials.json para backend/ |
| **Job fica em PROCESSING** | Verificar logs, pode estar calculando |
| **Frontend não conecta** | Verificar `REACT_APP_API_URL` em .env |

Mais detalhes em [GUIA_PRATICO.md](GUIA_PRATICO.md#-troubleshooting-comum)

---

## 📞 Contato / Suporte

Para dúvidas sobre:

- **Arquitetura**: Ver [ANALISE_INTEGRACAO.md](ANALISE_INTEGRACAO.md)
- **Código**: Ver [PLANO_TECNICO.md](PLANO_TECNICO.md)
- **Setup**: Ver [GUIA_PRATICO.md](GUIA_PRATICO.md)
- **Decisões**: Ver [SUMARIO_EXECUTIVO.md](SUMARIO_EXECUTIVO.md)

---

## 📊 Documentos por Rol

### 👔 Product Manager / Gerente
→ [SUMARIO_EXECUTIVO.md](SUMARIO_EXECUTIVO.md)

### 🏛️ Tech Lead / Arquiteto
→ [ANALISE_INTEGRACAO.md](ANALISE_INTEGRACAO.md)  
→ [PLANO_TECNICO.md](PLANO_TECNICO.md)

### 💻 Desenvolvedor Backend
→ [PLANO_TECNICO.md](PLANO_TECNICO.md)  
→ [GUIA_PRATICO.md](GUIA_PRATICO.md)

### 🔧 Desenvolvedor Frontend
→ [GUIA_PRATICO.md](GUIA_PRATICO.md) (seção Frontend Integration)

### 🔐 DevOps / SRE
→ [PLANO_TECNICO.md](PLANO_TECNICO.md) (Dockerfile, docker-compose)

---

## 📈 Esperado após Implementação

✅ Website funcional para otimização automática de campanhas  
✅ Interface intuitiva para não-técnicos  
✅ Histórico persistente de sugestões  
✅ Exportação para CSV/Excel  
✅ API reutilizável para integrações futuras  
✅ Base para machine learning adicional  

---

## 🎓 Aprenda Mais

- FastAPI Docs: https://fastapi.tiangolo.com/
- BigQuery Python: https://cloud.google.com/bigquery/docs/reference/python
- PySpark Guide: https://spark.apache.org/docs/latest/api/python/
- React Hooks: https://react.dev/reference/react

---

## 📋 Histórico de Documentação

| Data | Versão | Autores | Status |
|------|--------|---------|--------|
| 2026-06-01 | 1.0 | Análise Técnica | ✅ Completo |

---

## 🏁 Próximos Passos

1. **Hoje**: Ler [SUMARIO_EXECUTIVO.md](SUMARIO_EXECUTIVO.md)
2. **Amanhã**: Kickoff com team
3. **Próxima semana**: Começar dev conforme [GUIA_PRATICO.md](GUIA_PRATICO.md)

---

**Última atualização**: 2026-06-01  
**Status**: 🟢 Pronto para Desenvolvimento  
**Responsável**: Copilot GitHub
