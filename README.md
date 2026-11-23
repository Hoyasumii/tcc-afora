# Da cerimônia à declaração: o afora e as garantias de runtime para backends TypeScript

Trabalho de Conclusão de Curso de **Alan Reis Anjos** (Ciência da Computação, Universidade Tiradentes, 2026), com orientação de Luiz Gomes da Cunha Neto, sobre o [afora](https://github.com/afora-framework/core), um framework TypeScript open source para backends.

| Arquivo | O que é |
| --- | --- |
| [`tcc/tcc-afora-sbc.pdf`](tcc/tcc-afora-sbc.pdf) | O artigo do TCC, em 15 páginas, no modelo da SBC |
| [`tcc/tcc-afora-completo.pdf`](tcc/tcc-afora-completo.pdf) | Relatório técnico: a versão estendida, com os detalhes de medição, histórico e uso real |
| [`tcc/metrics/`](tcc/metrics/) | Os scripts e as saídas de todas as medições citadas no texto |
| `tcc/*.tex`, `tcc/fig*`, `tcc/build/figs.py` | Fontes LaTeX e o gerador das figuras |

## Reproduzir as medições

Os scripts importam o código do afora por caminho relativo. Para rodá-los, copie a pasta `tcc/` para a raiz de um clone de [`afora-framework/core`](https://github.com/afora-framework/core) no commit `cc1dbc2` (versão 27.0.0-rc.4) e siga [`tcc/metrics/README.md`](tcc/metrics/README.md), que lista cada comando e a saída correspondente.

Nenhuma medição usou a API de um modelo de linguagem.
