// Repete http-latency.ts K vezes por N (processos separados) e resume mediana e IQR das medianas.
// Uso (de dentro de tcc/metrics): K=10 bun http-latency-rep.ts   -> http-latency-rep.out.json
const K = Number(process.env.K ?? 10);
const q = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); const i = (s.length - 1) * p; const lo = Math.floor(i); return +(s[lo]! + (s[Math.ceil(i)]! - s[lo]!) * (i - lo)).toFixed(1); };
const sum = (xs: number[]) => ({ mediana: q(xs, 0.5), p25: q(xs, 0.25), p75: q(xs, 0.75), min: q(xs, 0), max: q(xs, 1) });
const out: Record<string, unknown> = { bun: Bun.version, K, cpu: (await Bun.file("/proc/cpuinfo").text()).match(/model name\s*:\s*(.*)/)?.[1], nproc: navigator.hardwareConcurrency };
for (const N of [300, 1000, 3000]) {
	const runs: any[] = [];
	for (let k = 0; k < K; k++) {
		const p = Bun.spawnSync(["bun", "http-latency.ts"], { env: { ...process.env, N: String(N) } });
		runs.push(JSON.parse(p.stdout.toString()));
	}
	const col = (side: string, key: string) => runs.map((r) => r[side][key] as number);
	const P = "POST /posts µs (mediana)", G = "GET /posts/:id µs (mediana)";
	const ratio = (key: string) => runs.map((r) => r.afora[key] / r.enxuto[key]);
	out[`N=${N}`] = {
		afora: { POST: sum(col("afora", P)), GET: sum(col("afora", G)) },
		enxuto: { POST: sum(col("enxuto", P)), GET: sum(col("enxuto", G)) },
		razao_afora_sobre_enxuto: { POST: sum(ratio(P)), GET: sum(ratio(G)) },
	};
}
await Bun.write("http-latency-rep.out.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
