#!/usr/bin/env python3
"""Resume bench/results/latest.json: mediana (p50, ns) por cenário, nos três runtimes.
Inclui o caminho real da requisição (Entity.safeParse), não só o melhor caso do afora.
Uso: python3 tcc/metrics/bench-summary.py [bench/results/latest.json]"""
import json, sys
path = sys.argv[1] if len(sys.argv) > 1 else "bench/results/latest.json"
d = json.load(open(path))
want = {"afora blueprint.safeParse": "afora blueprint", "afora Entity.safeParse": "afora Entity",
        "Zod 4 safeParse": "Zod 4", "Valibot safeParse": "Valibot", "ArkType": "ArkType",
        "TypeBox compiled (Check, then Errors on failure)": "TypeBox compilado", "Ajv compiled (allErrors)": "Ajv"}
out = {"afora": d["afora"], "generatedAt": d["generatedAt"], "runs": []}
for r in d["runs"]:
    run = {"runtime": r["version"], "cpu": r["cpu"], "os": r["os"], "scenarios": {}}
    for t in r["tables"]:
        row = {}
        for x in t["rows"]:
            for k, v in want.items():
                if x["contender"] == k or (k == "ArkType" and x["contender"].startswith("ArkType")) or (k.startswith("TypeBox") and x["contender"].startswith("TypeBox compiled")):
                    row[v] = round(x["p50"])
        if "afora Entity" in row:
            row["Entity/Zod"] = round(row["afora Entity"] / row["Zod 4"], 2)
            row["blueprint/Zod"] = round(row["afora blueprint"] / row["Zod 4"], 2)
            row["blueprint/Valibot"] = round(row["afora blueprint"] / row["Valibot"], 2)
        run["scenarios"][f'{t["scenario"]}/{t["case"]}'] = row
    out["runs"].append(run)
print(json.dumps(out, indent=1, ensure_ascii=False))
