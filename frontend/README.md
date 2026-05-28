# Promotional Campaign Optimizer - Frontend

Interface web para otimização de campanhas promocionais 3P.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- npm ou yarn
- Configuração de credenciais Nexus (para @maas-components)

### Installation

```bash
cd frontend

# Configure Nexus auth
export NEXUS_AUTH=$(echo -n 'username:password' | base64)

# Install dependencies
npm install
```

### Configuration

Crie um arquivo `.env.local` com as variáveis necessárias:

```bash
cp .env.example .env.local
```

Edite `.env.local`:
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
```

### Development

```bash
npm start
```

Abre [http://localhost:3000](http://localhost:3000) no navegador.

### Build for Production

```bash
npm run build
```

Gera a pasta `build/` otimizada para produção.

## 📁 Estrutura do Projeto

```
src/
├── pages/
│   ├── OptimizationPage.jsx    # Página principal de otimização
│   └── HistoryPage.jsx         # Página de histórico
├── services/
│   └── api.js                  # Cliente HTTP (Axios)
├── App.jsx                      # Componente raiz
└── index.jsx                    # Ponto de entrada
```

## 🎨 Design

- **Framework UI**: @maas-components/core (Material-UI v4)
- **Tema**: Dark mode (Magalu)
- **Cores principais**: 
  - Primary: #06b6d4 (Cyan)
  - Secondary: #8b5cf6 (Purple)
  - Background: #0f172a (Dark)

## 📝 Features

- ✅ Formulário de otimização com validação
- ✅ Histórico de requisições
- ✅ Download de resultados em XLSX
- ✅ Indicador de timeout após 10 minutos
- ✅ Tratamento de erros com feedback visual
- ✅ Responsivo (desktop, tablet, mobile)

## 🔗 API Integration

A interface se comunica com a API backend via endpoints:

- `POST /api/v1/optimize` - Executar otimização
- `GET /api/v1/history` - Obter histórico
- `GET /api/v1/optimization/{request_id}` - Obter status de uma requisição

## 📦 Dependencies

Ver `package.json` para lista completa.

Principais:
- `react@17.0.2`
- `@maas-components/core@4.x`
- `axios@1.6.0`
- `react-router-dom@5.3.4`

## 🚨 Troubleshooting

### "Cannot find module '@maas-components/core'"

Garanta que `NEXUS_AUTH` está configurado corretamente:

```bash
export NEXUS_AUTH=$(echo -n 'seu_username:sua_senha' | base64)
npm install
```

### Port 3000 already in use

```bash
PORT=3001 npm start
```

## 📚 Documentação da API

Ver `../docs/API.md` para documentação completa dos endpoints.

## 📄 Licença

Magalu Internal Use Only
