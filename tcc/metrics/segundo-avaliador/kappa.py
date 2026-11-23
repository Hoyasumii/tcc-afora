# Compara a classificação cega (classificacao.csv) com a de review-cost.classes.json.
# Uso: python3 tcc/metrics/segundo-avaliador/kappa.py   (na raiz do repositório)
# Saída: tcc/metrics/segundo-avaliador/kappa.out.json
import csv, json, os, re
from collections import Counter

CODIGOS = ["undeclared", "sensitive", "problems", "unique", "ownership", "concurrency", "none"]
aqui = os.path.dirname(os.path.abspath(__file__))
classes = json.load(open(os.path.join(aqui, "..", "review-cost.classes.json")))

def primeira(lado):
    rotulo = {}
    for codigo, v in classes[lado]["classes"].items():
        for a, b in v["ranges"]:
            for i in range(a, b + 1):
                rotulo[i] = codigo
    return rotulo

def kappa(pares):
    n = len(pares)
    po = sum(a == b for a, b in pares) / n
    ca, cb = Counter(a for a, _ in pares), Counter(b for _, b in pares)
    pe = sum(ca[c] * cb[c] for c in CODIGOS) / (n * n)
    return {"n": n, "concordancia": round(po, 3), "kappa": round((po - pe) / (1 - pe), 3) if pe < 1 else 1.0}

linhas = list(csv.DictReader(open(os.path.join(aqui, "classificacao.csv"))))
vazios = [f'{r["lado"]}:{r["linha"]}' for r in linhas if r["codigo"].strip() not in CODIGOS]
if vazios:
    raise SystemExit(f"{len(vazios)} linhas sem código válido ({', '.join(CODIGOS)}), por exemplo: {vazios[:5]}")

saida, todos = {}, []
for lado in ["baseline", "afora"]:
    texto = open(classes[lado]["file"]).read().split("\n")
    ref = primeira(lado)
    pares, confusao = [], Counter()
    linhas_por, chars_por = Counter(), Counter()
    for r in (r for r in linhas if r["lado"] == lado):
        i, b = int(r["linha"]), r["codigo"].strip()
        a = ref.get(i, "none")
        pares.append((a, b)); confusao[f"{a} -> {b}"] += 1
        if b != "none":
            linhas_por[b] += 1
            chars_por[b] += len(re.sub(r"\s", "", texto[i - 1]))
    todos += pares
    saida[lado] = {
        **kappa(pares),
        "tabela9_segunda_classificacao": {c: {"linhas": linhas_por[c], "caracteres": chars_por[c]} for c in CODIGOS[:-1]},
        "divergencias": {k: v for k, v in sorted(confusao.items()) if k.split(" -> ")[0] != k.split(" -> ")[1]},
    }
saida["geral"] = kappa(todos)
json.dump(saida, open(os.path.join(aqui, "kappa.out.json"), "w"), indent=1, ensure_ascii=False)
print(json.dumps({k: (v if k == "geral" else {"kappa": v["kappa"], "n": v["n"]}) for k, v in saida.items()}, ensure_ascii=False))
