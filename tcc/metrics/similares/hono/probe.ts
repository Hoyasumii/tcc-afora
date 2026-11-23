// Sonda das células "Hono + Zod" da Tabela de similares (TCC): o mesmo roteiro do NestJS e do tRPC.
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const users = new Map<string, { id: string; email: string; passwordHash: string; isAdmin: boolean }>();
const app = new Hono();
const body = z.object({ email: z.email(), password: z.string() });
app.post("/users", async (c) => {
	const input = body.parse(await c.req.json());
	if ([...users.values()].some((u) => u.email === input.email)) throw new Error("email taken");
	const user = { id: crypto.randomUUID(), isAdmin: false, ...input, passwordHash: "argon2id$fake$" + input.password };
	users.set(user.id, user);
	return c.json(user, 201);
});
app.post("/users/validator", zValidator("json", body), (c) => c.json(c.req.valid("json"), 201));
app.post("/users/validator-strict", zValidator("json", z.strictObject(body.shape)), (c) => c.json(c.req.valid("json"), 201));
app.post("/users/strict", async (c) => c.json(z.strictObject(body.shape).parse(await c.req.json()), 201));
const post = async (path: string, b: unknown) => {
	const r = await app.request(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) });
	return { status: r.status, body: await r.text() };
};
const origError = console.error; console.error = () => {};
const valid = await post("/users", { email: "a@x.com", password: "Secr3t!" });
const extra = await post("/users", { email: "c@x.com", password: "Secr3t!", isAdmin: true });
const dup = await post("/users", { email: "a@x.com", password: "Secr3t!" });
const strict = await post("/users/strict", { email: "d@x.com", password: "Secr3t!", isAdmin: true });
const zv = await post("/users/validator", { email: "e@x.com", password: "Secr3t!", isAdmin: true });
const zvs = await post("/users/validator-strict", { email: "f@x.com", password: "Secr3t!", isAdmin: true });
console.error = origError;
console.log(JSON.stringify({
	tool: "Hono 4.13.20 + Zod 4.6.7 + @hono/zod-validator 0.9.1", runtime: `Bun ${Bun.version}`,
	valid: { status: valid.status, passwordHashInResponse: /passwordHash/.test(valid.body) },
	extraKey: { status: extra.status, isAdminTrueInResponse: /"isAdmin":true/.test(extra.body) },
	businessError: { status: dup.status, body: dup.body.slice(0, 40) },
	strictObjectOptIn: { status: strict.status, note: "ZodError sem onError" },
	zValidator: { status: zv.status, isAdminTrueInResponse: /"isAdmin":true/.test(zv.body) },
	zValidatorStrictObject: { status: zvs.status },
}, null, 2));
