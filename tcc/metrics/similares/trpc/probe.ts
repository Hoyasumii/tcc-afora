// Sonda das células "tRPC" da Tabela de similares (TCC): setup mínimo da documentação (initTRPC + adaptador fetch).
import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";

const t = initTRPC.create();
const users = new Map<string, { id: string; email: string; passwordHash: string; isAdmin: boolean }>();
const router = t.router({
	createUser: t.procedure
		.input(z.object({ email: z.email(), password: z.string() }))
		.mutation(({ input }) => {
			if ([...users.values()].some((u) => u.email === input.email)) throw new Error("email taken");
			const user = { id: crypto.randomUUID(), isAdmin: false, ...input, passwordHash: "argon2id$fake$" + input.password };
			users.set(user.id, user);
			return user;
		}),
	createUserStrict: t.procedure
		.input(z.strictObject({ email: z.email(), password: z.string() }))
		.mutation(({ input }) => ({ email: input.email })),
});
const call = async (proc: string, body: unknown) => {
	const r = await fetchRequestHandler({
		endpoint: "/trpc", router, createContext: () => ({}),
		req: new Request(`http://x/trpc/${proc}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
	});
	return { status: r.status, body: await r.text() };
};
const valid = await call("createUser", { email: "a@x.com", password: "Secr3t!" });
const extra = await call("createUser", { email: "c@x.com", password: "Secr3t!", isAdmin: true });
const dup = await call("createUser", { email: "a@x.com", password: "Secr3t!" });
const strict = await call("createUserStrict", { email: "d@x.com", password: "Secr3t!", isAdmin: true });
console.log(JSON.stringify({
	tool: "tRPC 11.29.7 + Zod 4.6.7", runtime: `Bun ${Bun.version}`,
	valid: { status: valid.status, passwordHashInResponse: /passwordHash/.test(valid.body) },
	extraKey: { status: extra.status, isAdminTrueInResponse: /"isAdmin":true/.test(extra.body) },
	businessError: { status: dup.status, code: /INTERNAL_SERVER_ERROR/.test(dup.body) ? "INTERNAL_SERVER_ERROR" : dup.body.slice(0, 80) },
	strictObjectOptIn: { status: strict.status },
}, null, 2));
