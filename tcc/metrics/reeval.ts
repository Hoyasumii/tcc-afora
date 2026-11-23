// Reavalia, sem API, as implementações versionadas do examples/agent-built
// (afora claude-code-2 e linha de base claude-code-2), no briefing 2, em memória.
import { evaluate, EVAL_JWT_SECRET } from "../../examples/agent-built/eval/invariants";
process.env.JWT_SECRET = EVAL_JWT_SECRET;
const which = process.argv[2];
let handler: any;
if (which === "afora") {
  const { App } = await import("../../examples/agent-built/src/domain");
  await App.start();
  handler = App.outputs.Api.build().fetch;
} else {
  const mod: any = await import("../../examples/agent-built/baseline/runs/claude-code-2/app.ts");
  const app = mod.default ?? mod.app;
  handler = app.fetch ? app.fetch.bind(app) : app;
}
const r = await evaluate(handler, 2);
const by: Record<string, [number, number]> = {};
for (const c of r.checks) { by[c.invariant] ??= [0, 0]; by[c.invariant][1]++; if (c.ok) by[c.invariant][0]++; }
console.log(JSON.stringify({ which, bun: Bun.version, by, failed: r.checks.filter(c => !c.ok) }, null, 1));
