---
name: maas-components-frontend
description: "Guia completo para implementação de frontend React usando @maas-components/core (MUI v4 interno do Luizalabs). Use quando configurar projetos com @maas-components/core, corrigir incompatibilidades MUI v4 vs v5, ajustar React 17, Nexus/.npmrc, tema e imports."
user-invocable: true
disable-model-invocation: false
applyTo: "**/*.jsx,**/*.tsx,**/*.js,**/*.ts"
---

# Guia de Implementação: @maas-components/core

## Contexto

`@maas-components/core` é o design system interno do Luizalabs, baseado em **Material UI v4** (`@material-ui/core`). A importação muda, mas a API e os componentes são os mesmos do MUI v4.

## Registro do Nexus

A biblioteca está no registry privado. O arquivo `.npmrc` do projeto **deve** conter:

```ini
legacy-peer-deps=true
@maas-themes:registry=https://nexus.luizalabs.com/repository/npm/
@maas-components:registry=https://nexus.luizalabs.com/repository/npm/
@shell-components:registry=https://nexus.luizalabs.com/repository/npm/
@maas-tools:registry=https://nexus.luizalabs.com/repository/npm/
@ps-components:registry=https://nexus.luizalabs.com/repository/npm/
//nexus.luizalabs.com/repository/npm/:_auth=${NEXUS_AUTH}
```

A instalação requer `NEXUS_AUTH` definido como variável de ambiente (token base64):

```bash
export NEXUS_AUTH=<seu_token_base64>
npm install
```

## Compatibilidade de Dependências

`@maas-components/core@4.x` exige `react@^16.8.0 || ^17.0.0`. **Não é compatível com React 18 sem `legacy-peer-deps`.**

Configuração recomendada do `package.json`:

```json
{
  "dependencies": {
    "@emotion/react": "^11.x",
    "@emotion/styled": "^11.x",
    "@maas-components/core": "latest",
    "react": "^17.0.2",
    "react-dom": "^17.0.2"
  },
  "devDependencies": {
    "@types/react": "^17.0.0",
    "@types/react-dom": "^17.0.0"
  }
}
```

## Padrão de Importação

```jsx
// ✅ Correto — maas-components
import { Box, Typography, Button, Card } from '@maas-components/core';

// ❌ Errado — não usar material-ui diretamente
import { Box } from '@material-ui/core';
import Box from '@material-ui/core/Box';
```

## Ponto de Entrada (React 17)

React 17 usa `ReactDOM.render`, **não** `createRoot`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom'; // <- nao 'react-dom/client'

ReactDOM.render(
  <React.StrictMode><App /></React.StrictMode>,
  document.getElementById('root')
);
```

## Componentes com Diferenças Críticas vs MUI v5

### ❌ Componentes que NÃO existem no MUI v4 / @maas-components/core@4

| Componente MUI v5 | Alternativa em MUI v4 |
|---|---|
| `ListItemButton` | `<ListItem button>` |
| `Stack` (standalone) | Pode existir, mas verificar; usar `Box display="flex"` se não funcionar |
| `sx` prop com `gap`, `flexDirection` etc. | Funciona, mas não para todo componente |

### ListItem clicável

```jsx
// ✅ MUI v4 correto
<ListItem
  button
  onClick={handleClick}
  selected={isActive}
  style={{ borderRadius: 8, background: isActive ? 'rgba(34,211,238,0.08)' : 'transparent' }}
>
  <ListItemIcon style={{ color: isActive ? '#22d3ee' : '#64748b' }}>
    <Icon />
  </ListItemIcon>
  <ListItemText
    primary="Label"
    primaryTypographyProps={{ style: { fontWeight: 600 } }}
  />
</ListItem>

// ❌ MUI v5 — NÃO funciona em v4
<ListItem disablePadding>
  <ListItemButton selected={active}>...</ListItemButton>
</ListItem>
```

### Typography — Prop `color`

MUI v4 só aceita valores específicos para `color`:

```jsx
// ✅ Valores aceitos em MUI v4
<Typography color="textSecondary">...</Typography>
<Typography color="textPrimary">...</Typography>
<Typography color="primary">...</Typography>
<Typography color="secondary">...</Typography>
<Typography color="error">...</Typography>
<Typography color="initial">...</Typography>
<Typography color="inherit">...</Typography>

// ❌ MUI v5 — NÃO funciona em v4
<Typography color="text.secondary">...</Typography>
<Typography color="text.disabled">...</Typography>
<Typography color="text.primary">...</Typography>
```

Para cores customizadas ou `text.disabled`, use `sx` ou `style`:

```jsx
<Typography sx={{ color: '#64748b' }}>...</Typography>
<Typography style={{ color: '#64748b' }}>...</Typography>
```

### Typography — Props de estilo inline

MUI v4 **não** repassa props de tipografia diretamente para o DOM:

```jsx
// ❌ Gera warning "React does not recognize prop on DOM element"
<Typography fontWeight={700} lineHeight={1.2}>...</Typography>

// ✅ Use sx ou style
<Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>...</Typography>
<Typography style={{ fontWeight: 700, lineHeight: 1.2 }}>...</Typography>
```

### Prop `sx`

A prop `sx` funciona em componentes MUI v4 com `@emotion/styled` instalado. Garanta que `@emotion/react` e `@emotion/styled` estejam nas dependências.

```jsx
// ✅ Funciona com emotion instalado
<Box sx={{ display: 'flex', gap: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
```

### Overrides de tema

```jsx
// ✅ MUI v4 — "overrides" + nomes de slot diferentes
const theme = createTheme({
  overrides: {
    MuiDrawer: {
      paper: { width: 240, background: '#0f172a' },
    },
  },
});

// ❌ MUI v5 — NÃO usar em v4
const theme = createTheme({
  components: {
    MuiDrawer: {
      styleOverrides: { paper: { width: 240 } },
    },
  },
});
```

`index.css` mínimo:

```css
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap");

*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; padding: 0; }
```

## Checklist de Setup

- [ ] `.npmrc` com `legacy-peer-deps=true` e registry do Nexus
- [ ] `NEXUS_AUTH` definido no ambiente antes de `npm install`
- [ ] React na versão `^17.0.2`
- [ ] `@emotion/react` e `@emotion/styled` instalados
- [ ] `ReactDOM.render()` (não `createRoot`)
- [ ] Tema com `type: 'dark'` (não `mode`)
- [ ] Overrides com `overrides:` (não `components:`)
- [ ] `Typography` sem `color="text.*"` — usar `"textSecondary"` ou `sx`
- [ ] Sem `ListItemButton` — usar `<ListItem button>`
- [ ] Sem `postcss.config.js` / `tailwind.config.js` (se não usar Tailwind)
