# Caracteres não brancos por garantia, com as mesmas faixas de review-cost.classes.json.
# Uso: python3 tcc/metrics/review-cost-chars.py   (na raiz do repositório)
import json, re
c = json.load(open('tcc/metrics/review-cost.classes.json'))
res = {}
for side in ['baseline', 'afora']:
    L = open(c[side]['file']).read().split('\n')
    per = {k: sum(len(re.sub(r'\s', '', L[i-1])) for a, b in v['ranges'] for i in range(a, b+1)) for k, v in c[side]['classes'].items()}
    res[side] = {'chars_total': len(re.sub(r'\s', '', "\n".join(L))), 'chars_guarantees': sum(per.values()), 'per': per}
print(json.dumps(res, indent=1))
