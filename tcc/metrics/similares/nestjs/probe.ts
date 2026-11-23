// Sonda das células "NestJS" da Tabela de similares (TCC), com o mínimo da documentação oficial.
import "reflect-metadata";
import { Body, ClassSerializerInterceptor, Controller, Module, Post, ValidationPipe } from "@nestjs/common";
import { NestFactory, Reflector } from "@nestjs/core";
import { Exclude } from "class-transformer";
import { IsEmail, IsString } from "class-validator";

class CreateUserDto {
	@IsEmail() email!: string;
	@IsString() password!: string;
}
class User {
	id = crypto.randomUUID();
	email!: string;
	passwordHash!: string;
	isAdmin = false;
	constructor(data: Partial<User>) { Object.assign(this, data); }
}
class SafeUser extends User {
	@Exclude() declare passwordHash: string;
}
const emails = new Set<string>();

@Controller("users")
class UsersController {
	@Post() create(@Body() body: CreateUserDto) {
		if (emails.has(body.email)) throw new Error("email taken"); // erro de negócio comum, não HttpException
		emails.add(body.email);
		return new User({ ...body, passwordHash: "argon2id$fake$" + body.password });
	}
	@Post("safe") createSafe(@Body() body: CreateUserDto) {
		return new SafeUser({ email: body.email, passwordHash: "argon2id$fake$x" });
	}
}
@Module({ controllers: [UsersController] }) class AppModule {}

async function run(label: string, setup: (app: any) => void) {
	emails.clear();
	const app = await NestFactory.create(AppModule, { logger: false });
	setup(app);
	await app.listen(0);
	const url = await app.getUrl();
	const post = async (path: string, body: unknown) => {
		const r = await fetch(url + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
		return { status: r.status, body: await r.text() };
	};
	const valid = await post("/users", { email: "a@x.com", password: "Secr3t!" });
	const extra = await post("/users", { email: "c@x.com", password: "Secr3t!", isAdmin: true });
	const dup = await post("/users", { email: "a@x.com", password: "Secr3t!" });
	const safe = await post("/users/safe", { email: "b@x.com", password: "Secr3t!" });
	const out = {
		config: label,
		valid: { status: valid.status, passwordHashInResponse: /passwordHash/.test(valid.body) },
		extraKey: { status: extra.status, isAdminTrueInResponse: /"isAdmin":true/.test(extra.body) },
		businessErrorStatus: dup.status,
		excludeOptIn: { status: safe.status, passwordHashInResponse: /passwordHash/.test(safe.body) },
	};
	await app.close();
	return out;
}

const results = [
	await run("sem ValidationPipe", () => {}),
	await run("ValidationPipe()", (app) => app.useGlobalPipes(new ValidationPipe())),
	await run("ValidationPipe({ whitelist, forbidNonWhitelisted }) + ClassSerializerInterceptor", (app) => {
		app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
		app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
	}),
];
console.log(JSON.stringify({ tool: "NestJS 12.6.0", runtime: `Bun ${Bun.version}`, results }, null, 2));
