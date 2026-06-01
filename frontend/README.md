# Promotional Campaign Optimizer - Frontend

Interface web autônoma para otimização de campanhas promocionais 3P.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- npm ou yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) no navegador.

### Build for Production

```bash
npm run build
```

Gera a pasta `dist/` otimizada para produção.

## 📁 Estrutura do Projeto

```
src/
├── pages/
│   ├── OptimizationPage.jsx    # Página principal de otimização
│   └── HistoryPage.jsx         # Página de histórico
├── services/
│   └── api.js                  # Serviço local de otimização e histórico
├── App.jsx                      # Componente raiz
└── index.jsx                    # Ponto de entrada
```

## 🎨 Design

Este frontend foi construído seguindo as orientações do `SKILL.md` como design system:
- React 17 com `ReactDOM.render`
- Tema escuro e cores principais inspiradas em Material UI v4
- Componentes com estrutura semântica e tipografia clara
- Layout responsivo com navegação lateral e cards.

## 📝 Features

- ✅ Formulário de otimização com validação de campos
- ✅ Resultado local de otimização com resumo de campanha
- ✅ Download de planilha CSV gerada no cliente
- ✅ Histórico de solicitações salvo no navegador
- ✅ Indicador de timeout após 10 minutos
- ✅ Erros exibidos diretamente na interface

## ⚠️ Observação

Esta interface é autônoma e não faz integração com backend ou serviços externos. Todos os dados de histórico e geração de planilha são mantidos localmente no navegador.

