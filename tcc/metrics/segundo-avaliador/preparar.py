# Gera as listagens numeradas e a planilha em branco para a classificação cega.
# Uso: python3 tcc/metrics/segundo-avaliador/preparar.py   (na raiz do repositório)
# Não lê review-cost.classes.json: quem classifica não deve ver a primeira classificação.
import csv, os

ARQUIVOS = {
    "baseline": "examples/agent-built/baseline/runs/claude-code-2/app.ts",
    "afora": "examples/agent-built/afora.json",
}
aqui = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(aqui, "classificacao.csv"), "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["lado", "linha", "codigo", "trecho"])
    for lado, caminho in ARQUIVOS.items():
        linhas = open(caminho).read().split("\n")
        with open(os.path.join(aqui, f"listagem-{lado}.txt"), "w") as out:
            for i, l in enumerate(linhas, 1):
                out.write(f"{i:4d} | {l}\n")
        for i, l in enumerate(linhas, 1):
            if l.strip():
                w.writerow([lado, i, "", l.strip()[:80]])
print("ok: listagem-baseline.txt, listagem-afora.txt, classificacao.csv")
