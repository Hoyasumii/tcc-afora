// CRUD de posts no afora: as quatro declarações (entidade, repositório,
// comando e saída HTTP) e a aplicação que as liga.
import { applicationOf, blueprintOf, commandOf, entityOf, outputOf, repositoryOf, resourceOf } from "@afora/core";
import { hono } from "@afora/hono";

// 1. Entidade
export class Post extends entityOf(
	blueprintOf((ctx) => ({
		name: ctx.text,
		slug: ctx.slug,
		description: ctx.text,
		cover: ctx.url,
		type: ctx.text,
	})),
	{ name: "Post", change: ["name", "slug", "description", "cover", "type"] },
) {}

// 2. Repositório
export const Posts = repositoryOf({
	entity: Post,
	actions: ["findById", "findPage", "create", "update", "delete"],
});

// 3. Comando: create, get, list, update e delete; escrita só com o escopo posts:write
export const Blog = commandOf({
	name: "Blog",
	useCases: resourceOf(Posts, {
		path: "/posts",
		access: {
			create: { scopes: ["posts:write"] },
			update: { scopes: ["posts:write"] },
			delete: { scopes: ["posts:write"] },
			get: { public: true },
			list: { public: true },
		},
	}),
});

// 4. Saída HTTP
export const Api = outputOf({
	name: "Api",
	commands: [Blog],
	pipe: [hono({ basePath: "/api", auth: { jwt: { secret: { env: "JWT_SECRET" } } } })],
});

export const App = applicationOf({
	name: "posts",
	entities: { Post },
	repositories: { Posts },
	commands: { Blog },
	outputs: { Api },
});
