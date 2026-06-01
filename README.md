# Interface-2026-1

Frontend do **Atlas** (React + TypeScript + Vite). Consome a API do backend para login, dashboard, chatbot e mapas.

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- npm (incluído com o Node.js)
- API do backend em execução (por padrão em `http://127.0.0.1:5000`)

## Configuração

1. Clone o repositório e entre na pasta do projeto:

```bash
git clone https://github.com/Code-Nine-FTC/Interface-2026-1.git
cd Interface-2026-1
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Edite o arquivo `.env` se a API estiver em outro host ou porta:

```env
# URL base da API (sem barra no final)
VITE_API_BASE_URL=http://127.0.0.1:5000
```

> Reinicie o servidor de desenvolvimento após alterar o `.env`.

## Como rodar

### Desenvolvimento

Com o backend rodando, inicie o frontend:

```bash
npm run dev
```

O Vite exibirá no terminal a URL local (geralmente `http://localhost:5173`). Abra essa URL no navegador.

### Build de produção

```bash
npm run build
```

Os arquivos gerados ficam em `dist/`.

### Pré-visualizar o build

```bash
npm run preview
```

## Scripts disponíveis

| Comando           | Descrição                          |
|-------------------|------------------------------------|
| `npm run dev`     | Servidor de desenvolvimento (Vite) |
| `npm run build`   | Compila TypeScript e gera o build  |
| `npm run preview` | Serve o build localmente           |

## Variáveis de ambiente

| Variável              | Descrição                    | Padrão                    |
|-----------------------|------------------------------|---------------------------|
| `VITE_API_BASE_URL`   | URL base da API do backend   | `http://127.0.0.1:5000`   |

O valor padrão também está definido em `src/config/env.ts` caso a variável não seja informada.

Para deploy, defina `VITE_API_BASE_URL` no ambiente de CI/host **antes** de executar `npm run build`.

## Estrutura resumida

- `src/pages/` — páginas (Login, Dashboard, Chatbot, Report)
- `src/services/` — chamadas à API
- `src/config/env.ts` — leitura centralizada da URL da API
