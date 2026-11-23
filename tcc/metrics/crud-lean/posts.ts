// CRUD de posts enxuto e convencional: Hono + Zod + Drizzle (bun:sqlite), sem DDD.
// Mesmo comportamento observável do crud-afora: 401 sem token, 400 com chave
// extra, 409 com slug repetido, 404 para id desconhecido, erros em problem+json.
import { Database } from "bun:sqlite";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { z } from "zod";

const sqlite = new Database(process.env.DATABASE_PATH ?? ":memory:");
sqlite.run(`CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE, description TEXT NOT NULL, cover TEXT NOT NULL, type TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT)`);
const posts = sqliteTable("posts", {
	id: text("id").primaryKey(), name: text("name").notNull(), slug: text("slug").notNull().unique(),
	description: text("description").notNull(), cover: text("cover").notNull(), type: text("type").notNull(),
	createdAt: text("created_at").notNull(), updatedAt: text("updated_at"),
});
const db = drizzle(sqlite);

const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const text1 = z.string().trim().min(1);
const url = z.url().refine((u) => !/^(javascript|data|vbscript|file):/i.test(u));
const PostBody = z.object({ name: text1, slug: text1.transform(slugify), description: text1, cover: url, type: text1 }).strict();
const PostPatch = PostBody.partial().strict();
const Page = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20), offset: z.coerce.number().int().min(0).default(0) }).strict();

class Problem extends Error {
	constructor(readonly status: number, readonly title: string, readonly detail?: string) { super(title); }
}
const problem = (p: Problem) => new Response(JSON.stringify({ title: p.title, status: p.status, detail: p.detail }),
	{ status: p.status, headers: { "content-type": "application/problem+json" } });
const parse = <T extends z.ZodType>(schema: T, value: unknown): z.infer<T> => {
	const r = schema.safeParse(value);
	if (!r.success) throw new Problem(400, "Bad Request", r.error.issues.map((i) => i.message).join("; "));
	return r.data;
};
const body = async (req: Request) => { try { return await req.json(); } catch { throw new Problem(400, "Bad Request", "Invalid JSON."); } };
const requireWriter = async (req: Request) => {
	const token = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "")?.[1];
	if (!token) throw new Problem(401, "Unauthorized");
	const payload = await verify(token, process.env.JWT_SECRET!, "HS256").catch(() => { throw new Problem(401, "Unauthorized"); });
	if (!String(payload.scope ?? "").split(" ").includes("posts:write")) throw new Problem(403, "Forbidden");
};
const find = (id: string) => {
	const row = db.select().from(posts).where(eq(posts.id, id)).get();
	if (!row) throw new Problem(404, "Not Found");
	return row;
};
const unique = (fn: () => void) => {
	try { fn(); } catch (e) { if (String(e).includes("UNIQUE")) throw new Problem(409, "Conflict", "Slug taken."); throw e; }
};

export const app = new Hono().basePath("/api");
app.post("/posts", async (c) => {
	await requireWriter(c.req.raw);
	const row = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...parse(PostBody, await body(c.req.raw)) };
	unique(() => db.insert(posts).values(row).run());
	return c.json({ item: row }, 201);
});
app.get("/posts", (c) => {
	const { limit, offset } = parse(Page, c.req.query());
	const items = db.select().from(posts).limit(limit).offset(offset).all();
	const total = db.select({ n: sql<number>`count(*)` }).from(posts).get()!.n;
	return c.json({ items, total, limit, offset });
});
app.get("/posts/:id", (c) => c.json({ item: find(c.req.param("id")) }));
app.patch("/posts/:id", async (c) => {
	await requireWriter(c.req.raw);
	find(c.req.param("id"));
	const changes = { ...parse(PostPatch, await body(c.req.raw)), updatedAt: new Date().toISOString() };
	unique(() => db.update(posts).set(changes).where(eq(posts.id, c.req.param("id"))).run());
	return c.json({ item: find(c.req.param("id")) });
});
app.delete("/posts/:id", async (c) => {
	await requireWriter(c.req.raw);
	const item = find(c.req.param("id"));
	db.delete(posts).where(eq(posts.id, item.id)).run();
	return c.json({ item });
});
app.notFound(() => problem(new Problem(404, "Not Found")));
app.onError((e) => (e instanceof Problem ? problem(e) : problem(new Problem(500, "Internal Server Error"))));
