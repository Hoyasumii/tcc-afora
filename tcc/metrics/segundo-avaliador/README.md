# Segunda classificação da Tabela 9 (às cegas)

A Tabela 9 do TCC atribui cada linha da linha de base e do `afora.json` a uma garantia. A primeira classificação, em `../review-cost.classes.json`, foi feita pelo mesmo modelo que construiu o experimento. Este kit serve para uma segunda pessoa classificar as mesmas linhas **sem ver a primeira** e medir a concordância (κ de Cohen).

## Passos

1. Não abra `../review-cost.classes.json` nem a Tabela 9 antes de terminar.
2. Leia as definições abaixo.
3. Abra `listagem-baseline.txt` e `listagem-afora.txt` (o código com o número de cada linha).
4. Em `classificacao.csv`, preencha a coluna `codigo` de cada linha com um dos códigos abaixo. A coluna `trecho` traz o começo da linha, só para conferência.
5. Rode, na raiz do repositório: `python3 tcc/metrics/segundo-avaliador/kappa.py`. A saída vai para `kappa.out.json`.

Uma linha recebe um único código: o da garantia que ela existe para manter. Se ela não serve a nenhuma das seis, use `none`.

## Códigos

| Código | A linha existe para… |
| --- | --- |
| `undeclared` | recusar chaves que o contrato não declara no corpo da requisição |
| `sensitive` | impedir que senha, *hash* ou outro segredo apareça numa resposta |
| `problems` | transformar erros em `problem+json` com o status certo, ou impedir que um erro vire 5xx |
| `unique` | impedir e-mail ou *slug* repetido (resposta 409) |
| `ownership` | autenticar o chamador (emitir, assinar ou verificar o *token*) ou garantir que só o organizador lê ou altera o seu evento |
| `concurrency` | impedir que se vendam mais ingressos que a capacidade, inclusive sob compras simultâneas |
| `none` | nada disso: estrutura, rotas, modelos, regras de negócio comuns |

## Como interpretar

- κ ≥ 0,8: concordância forte; a Tabela 9 se sustenta e o TCC cita o κ na nota da tabela.
- 0,6 ≤ κ < 0,8: concordância substancial; o TCC cita o κ e mostra as duas contagens.
- κ < 0,6: as divergências (em `kappa.out.json`, campo `divergencias`) entram na discussão da Seção 4.8.3.

`kappa.out.json` também traz, em `tabela9_segunda_classificacao`, as linhas e os caracteres de cada garantia segundo a segunda classificação, no mesmo formato da Tabela 9.

O script foi testado preenchendo a planilha com a primeira classificação: κ = 1 e as contagens da Tabela 9 se reproduzem exatamente.
