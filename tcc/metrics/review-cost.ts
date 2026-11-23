// Conta, por garantia, as linhas não vazias da linha de base e do afora.json.
// Uso: bun tcc/metrics/review-cost.ts   (na raiz do repositório)
import classes from "./review-cost.classes.json";
const root = new URL("../../", import.meta.url).pathname;
const out: Record<string, unknown> = {};
for (const side of ["baseline", "afora"] as const) {
  const { file, classes: cls } = (classes as any)[side];
  const lines = (await Bun.file(root + file).text()).split("\n");
  const nonBlank = (i: number) => lines[i - 1] !== undefined && lines[i - 1].trim() !== "";
  const used = new Set<number>();
  const per: Record<string, number> = {};
  for (const [k, v] of Object.entries<any>(cls)) {
    let n = 0;
    for (const [a, b] of v.ranges) for (let i = a; i <= b; i++) if (nonBlank(i)) { if (used.has(i)) throw new Error(`${side}: linha ${i} em duas classes`); used.add(i); n++; }
    per[k] = n;
  }
  const total = lines.filter((l) => l.trim() !== "").length;
  out[side] = { file, totalNonBlank: total, guarantees: used.size, share: +(used.size / total).toFixed(3), per };
}
console.log(JSON.stringify(out, null, 2));
