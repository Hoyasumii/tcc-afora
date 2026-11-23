#!/usr/bin/env python3
"""Conta arquivos e linhas de um mesmo CRUD de posts em três formas.

Critério (o mesmo nas três):
  - arquivos .ts de código de produção: exclui *.spec.ts e *.test.ts;
  - "linhas" = linhas físicas; "não vazias" = linhas com algum caractere não branco;
  - "caracteres" = caracteres não brancos (independe da formatação).
Roastery: src/ da cápsula capsules.post_post no commit informado. A contagem é
dada também por pasta, e sem os dublês de teste (src/infra/repositories/test),
o cache Redis (infra/repositories/cached) e os repositórios remotos
(infra/repositories/api), que as outras duas formas não têm.

Uso: python3 tcc/metrics/count-volume.py <caminho da cápsula capsules.post_post>
"""
import json, os, re, subprocess, sys
from collections import defaultdict

def stats(paths):
    files = lines = nonblank = chars = 0
    for p in paths:
        t = open(p, encoding="utf-8").read()
        L = t.split("\n")
        if L and L[-1] == "": L = L[:-1]
        files += 1; lines += len(L)
        nonblank += sum(1 for l in L if l.strip())
        chars += len(re.sub(r"\s", "", t))
    return {"files": files, "lines": lines, "nonblank": nonblank, "chars": chars}

def prod_ts(root):
    out = []
    for d, _, fs in os.walk(root):
        for f in fs:
            if f.endswith(".ts") and not f.endswith((".spec.ts", ".test.ts")):
                out.append(os.path.join(d, f))
    return sorted(out)

capsule = sys.argv[1] if len(sys.argv) > 1 else "../roastery-cms/capsules.post_post"
here = os.path.dirname(os.path.abspath(__file__))
try:
    commit = subprocess.run(["git", "-C", capsule, "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip() or None
except Exception:
    commit = None
src = os.path.join(capsule, "src")
allf = prod_ts(src)
excl = ("/infra/repositories/test/", "/infra/repositories/cached/", "/infra/repositories/api/")
by_dir = defaultdict(list)
for p in allf:
    rel = os.path.relpath(p, src)
    by_dir[rel.split(os.sep)[0]].append(p)
res = {
    "roastery": {"capsule": os.path.basename(os.path.abspath(capsule)), "commit": commit,
                 "all": stats(allf),
                 "comparable": stats([p for p in allf if not any(e in p.replace(os.sep, "/") for e in excl)]),
                 "by_layer": {k: stats(v) for k, v in sorted(by_dir.items())}},
    "afora": {"file": "tcc/metrics/crud-afora/posts.ts", **stats([os.path.join(here, "crud-afora/posts.ts")])},
    "lean": {"file": "tcc/metrics/crud-lean/posts.ts", **stats([os.path.join(here, "crud-lean/posts.ts")])},
}
print(json.dumps(res, indent=2, ensure_ascii=False))
