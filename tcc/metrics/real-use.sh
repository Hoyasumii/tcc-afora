#!/usr/bin/env bash
# Uso real do afora (TCC, Seção "Uso em sistemas reais").
# Uso: bash real-use.sh <clone de afora-framework/afora-cms> <clone de Hoyasumii/Hoyasumii>
# Critério: arquivos .ts/.tsx de produção (sem *.test.* e *.spec.*), linhas não vazias.
set -euo pipefail
CMS=${1:?caminho do afora-cms}; SITE=${2:?caminho do Hoyasumii}
nonblank() { local rev=$1; shift; git ls-tree -r --name-only "$rev" -- "$@" | grep -E '\.tsx?$' | grep -Ev '\.(test|spec)\.' |
  while read -r f; do git show "$rev:$f" | grep -cv '^\s*$' || true; done | awk '{s+=$1;n++} END{printf "%d arquivos, %d linhas não vazias\n", n, s}'; }
coauth() { git log --format='%(trailers:key=Co-Authored-By,valueonly)' "$@" | sed '/^$/d' | sed 's/ <.*//' | sort | uniq -c | sort -rn; }

echo "== afora-cms (getafora.com)"; cd "$CMS"
echo "HEAD $(git rev-parse --short HEAD); commits: $(git rev-list --count HEAD); período: $(git log --format=%ad --date=short | sort | sed -n '1p;$p' | paste -sd' ')"
echo "@afora/core: $(grep -ho '"@afora/core": *"[^"]*"' packages/domain/package.json apps/api/package.json | sort -u | paste -sd' ')"
echo "domínio + API: $(nonblank HEAD packages/domain apps/api)"
echo "testes: $(git ls-files packages/domain apps/api | grep -cE '\.test\.tsx?$') arquivos em packages/domain e apps/api ($(git ls-files | grep -cE '\.test\.tsx?$') no repositório)"
echo "declarações (chamadas, X( ou X<): $(grep -rhoE '\b(entityOf|repositoryOf|useCaseOf|exceptionOf|applicationOf)[<(]' --include=*.ts --exclude='*.test.ts' packages/domain/src apps/api/src | tr -d '(<' | sort | uniq -c | awk '{printf "%s %s; ", $2, $1}')"
echo "coautoria:"; coauth HEAD
cd - >/dev/null

echo; echo "== hoyasumii.dev (Hoyasumii/Hoyasumii, apps/api + packages/shared)"; cd "$SITE"
MIG=$(git log --format=%h --grep='Rebuild the API and the shared contract on @afora/core' | tail -1)
echo "migração: $MIG ($(git log -1 --format=%ad --date=short "$MIG")); merge: $(git log --format='%h %ad' --date=short --grep='afora-migration' | head -1)"
echo "@afora: $(grep -ho '"@afora/[a-z]*": *"[^"]*"' apps/api/package.json | paste -sd' ')"
echo "antes ($MIG^): $(nonblank "$MIG^" apps/api/src packages/shared/src)"
echo "depois ($MIG): $(nonblank "$MIG" apps/api/src packages/shared/src)"
echo "HEAD $(git rev-parse --short HEAD): $(nonblank HEAD apps/api/src packages/shared/src)"
for d in apps/api/src/domain apps/api/src/providers apps/api/src/services apps/api/src/repositories apps/api/src/routes packages/shared/src/schema.ts; do
  echo "  $d: antes $(nonblank "$MIG^" $d | cut -d, -f2) | depois $(nonblank "$MIG" $d | cut -d, -f2)"; done
echo "commits em apps/api: $(git rev-list --count HEAD -- apps/api)"; echo "coautoria (apps/api):"; coauth HEAD -- apps/api
