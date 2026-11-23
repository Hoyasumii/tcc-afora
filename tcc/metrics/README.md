# Medições do TCC

Tudo aqui foi executado em 19/11/2026 numa máquina virtual Linux x86-64 com 2 vCPUs
(Intel Xeon a 2,1 GHz), 8 GB de memória, Bun 1.4.4 e Node.js 22.23 (`machine.txt`).
Nenhuma medição usou a API de um modelo de linguagem. Comandos a partir da raiz do repositório.

| Medição | Comando | Saída |
| --- | --- | --- |
| Volume do mesmo CRUD em três formas | `python3 tcc/metrics/count-volume.py <caminho de roastery-cms/capsules.post_post>` | `count-volume.out.json` |
| Fumaça dos dois CRUDs novos | `cd tcc/metrics/crud-afora && bun smoke.ts`; `cd tcc/metrics/crud-lean && bun smoke.ts` | `crud-*/smoke.out.txt` |
| Custo de revisão (linhas) | `bun tcc/metrics/review-cost.ts` | `review-cost.out.json` |
| Custo de revisão (caracteres) | `python3 tcc/metrics/review-cost-chars.py` | `review-cost.chars.out.json` |
| Classificação das linhas | (editável) | `review-cost.classes.json` |
| Reavaliação das invariantes, sem API | `bun tcc/metrics/reeval.ts afora`; `bun tcc/metrics/reeval.ts baseline` | `reeval.out.json` |
| Resumo dos benchmarks | `python3 tcc/metrics/bench-summary.py bench/results/latest.json` | `bench-summary.out.json` |
| Latência da requisição completa | `cd tcc/metrics && N=1000 bun http-latency.ts` (também N=300 e N=3000) | `http-latency.N*.out.json` |

## Antes de rodar

Copie `tcc/` para a raiz de um clone de `afora-framework/core` (os scripts importam `../../src` e `../../examples/agent-built`) e instale as dependências próprias desta pasta: `cd tcc/metrics && bun install` (hono, zod e drizzle-orm, fixados em `package.json` e `bun.lock`). Cada sonda de `similares/` tem o seu `package.json` (e o NestJS, o seu `tsconfig.json`, com `experimentalDecorators`): `bun install` dentro dela.

## Critérios

- **Volume**: arquivos `.ts` de produção, sem `*.spec.ts`/`*.test.ts`; linhas físicas, não vazias e caracteres não brancos.
  A cápsula do Roastery foi contada no commit `b0c4f1f30c6d2a47a23ec9885727b7266e569dc0` (27/03/2026), também
  sem `infra/repositories/{test,cached,api}`, que as outras duas formas não têm. As formas `crud-afora` e `crud-lean`
  foram escritas para esta medição (por Claude Opus 5.5) e têm o mesmo comportamento observável (`smoke.ts`).
  Diferenças conhecidas: `crud-afora` usa o provedor em memória e `crud-lean` usa SQLite em memória;
  `crud-lean` foi escrito de forma compacta, por isso a comparação justa é a de caracteres.
- **Custo de revisão**: a classificação de cada faixa de linhas está em `review-cost.classes.json` e foi feita à mão;
  o `afora.json` é formatado com um valor por linha, o que infla as linhas.
- **Benchmarks**: medianas (p50) de `bench/results/latest.json` (afora 27.0.0-rc.4, commit `82e24ea`,
  AMD EPYC 9V74, 16/11/2026). Nada foi recomputado aqui.
- **Latência**: requisição inteira no `fetch` handler, sem rede, mediana após 200 de aquecimento.
  O tempo do afora cresce com N (provedor em memória); a máquina tem só 2 vCPUs e é ruidosa.

## O que não foi medido

- O lote `bun run eval:agent-built`, que precisa de `ANTHROPIC_API_KEY` e não foi executado por falta de recursos para custear a API. Estimativa sem chave: `cd examples/agent-built && bun run eval:all -- --runs 10 --models claude-opus-5-5 --briefs 3 --db memory --dry-run`.
  Sem ele: n = 1 por lado, nenhuma execução do briefing 3, nenhuma execução por agente em SQLite.
- Tempo humano de revisão.

## Medições de 22/11/2026

| Medição | Comando | Saída |
| --- | --- | --- |
| Uso real (CMS do getafora.com e API do hoyasumii.dev) | `bash tcc/metrics/real-use.sh <afora-cms> <Hoyasumii>` | `real-use.out.txt` |
| Células da tabela de similares | `cd tcc/metrics/similares/<nestjs|trpc|hono> && bun install && bun probe.ts` | `similares/*/probe.out.json` |
| Latência repetida (K = 10 por N, processos separados; mediana e IQR das medianas) | `cd tcc/metrics && K=10 bun http-latency-rep.ts` | `http-latency-rep.out.json` |

- **Uso real**: linhas não vazias de `.ts`/`.tsx` de produção. O `afora-cms` é privado (commit `78b772f`); o `Hoyasumii/Hoyasumii` é público (`4f41cb3^` → `4f41cb3`, HEAD `036c2a2`).
- **Similares**: o mesmo roteiro nas três ferramentas: cadastro que devolve a entidade com o hash; chave extra `isAdmin: true`; e-mail repetido sinalizado por um `Error` comum. Bun 1.4.4, 22/11/2026.

- **Correções de 22/11 após a avaliação independente**: `real-use.sh` passou a contar chamadas (`X(` ou `X<`), e não ocorrências textuais (o CMS tem 10 entidades, 10 repositórios, 37 casos de uso e 43 exceções; 46 arquivos de teste em `packages/domain` e `apps/api`); a sonda do Hono inclui o `@hono/zod-validator` 0.9.1; a latência passou a ser repetida 10 vezes, e a execução única de 19/11 (`http-latency.N*.out.json`) fica só como registro.
