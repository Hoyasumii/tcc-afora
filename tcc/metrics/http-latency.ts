// Latência de uma requisição inteira (fetch handler, sem rede), afora x enxuto.
// Uso: bun tcc/metrics/http-latency.ts   (de dentro de tcc/metrics)
import { sign } from "hono/jwt";
process.env.JWT_SECRET = "metrics-secret-0123456789abcdef0123456789";
const token = await sign({ sub: "u1", scope: "posts:write", exp: Math.floor(Date.now() / 1000) + 3600 }, process.env.JWT_SECRET, "HS256");
const A = await import("./crud-afora/posts"); await A.App.start();
const sides: Record<string, (r: Request) => Promise<Response> | Response> = {
	afora: A.App.outputs.Api.build().fetch,
	enxuto: ((await import("./crud-lean/posts")).app.fetch),
};
const N = Number(process.env.N ?? 3000);
const med = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const out: Record<string, unknown> = { bun: Bun.version, N, cpu: (await Bun.file("/proc/cpuinfo").text()).match(/model name\s*:\s*(.*)/)?.[1] };
for (const [name, fetch] of Object.entries(sides)) {
	const req = (m: string, p: string, b?: unknown) => fetch(new Request("http://x/api" + p, { method: m, headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: b ? JSON.stringify(b) : undefined }));
	let id = "";
	const post: number[] = [], get: number[] = [];
	for (let i = 0; i < N + 200; i++) {
		const t0 = Bun.nanoseconds();
		const r = await req("POST", "/posts", { name: "Post " + i, slug: `p-${name}-${i}`, description: "d", cover: "https://e.com/c.jpg", type: "review" });
		const j: any = await r.json(); const t1 = Bun.nanoseconds();
		id = j.item.id;
		const g = await req("GET", `/posts/${id}`); await g.json(); const t2 = Bun.nanoseconds();
		if (i >= 200) { post.push((t1 - t0) / 1000); get.push((t2 - t1) / 1000); }
	}
	out[name] = { "POST /posts µs (mediana)": +med(post).toFixed(1), "GET /posts/:id µs (mediana)": +med(get).toFixed(1) };
}
console.log(JSON.stringify(out, null, 1));
