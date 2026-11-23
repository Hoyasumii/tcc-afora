# Gera fig1 e fig2 (PDF vetorial e PNG) sem título interno.
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
plt.rcParams["font.family"] = "DejaVu Sans"
GRAY, BLUE, FILL, TXT, SUB = "#c9c7bd", "#2f76d2", "#e4eef9", "#111111", "#5a5a5a"

def box(ax, x, y, w, h, title, line1, line2=None, hi=False, date=None):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0,rounding_size=0.12",
                 lw=1.6 if hi else 1.1, ec=BLUE if hi else GRAY, fc=FILL if hi else "white"))
    ax.text(x + 0.25, y + h - 0.32, title, fontsize=12.5, fontweight="bold", color=TXT, va="center")
    if date: ax.text(x + w - 0.25, y + h - 0.32, date, fontsize=10, color=SUB, va="center", ha="right")
    ax.text(x + 0.25, y + h - 0.78, line1, fontsize=10.5, color=TXT, va="center")
    if line2: ax.text(x + 0.25, y + h - 1.15, line2, fontsize=9.5, color=SUB, va="center")

def arrow(ax, a, b):
    ax.add_patch(FancyArrowPatch(a, b, arrowstyle="-|>", mutation_scale=11, color="#b3b1a7", lw=1.1))

# Figura 1
fig, ax = plt.subplots(figsize=(9.2, 5.6)); ax.set_xlim(0, 12); ax.set_ylim(0, 7.3); ax.axis("off")
rows = [
 ("Caffeine", "jan. a fev. de 2026", "Pacotes privados: classe Entity, schemas TypeBox, erros, value objects e CLIs de agentes.", "Feito para servir um blog de música; o blog ficou parado enquanto a ferramenta crescia."),
 ("Roastery", "jan. a abr. de 2026", "CMS headless em microsserviços: cada recurso é uma cápsula com quatro camadas.", "Correto, mas caro: 87 arquivos na cápsula de posts e mais de 40 repositórios."),
 ("Extração", "mar. a ago. de 2026", "O repetido vira biblioteca: beans, terroir, pantry, barista, blend e aroma.", "Com o beans, a entidade encolhe para uma linha: a blueprint é o modelo."),
 ("afora", "out. a nov. de 2026", "Um núcleo sem servidor nem banco, adaptadores em volta, afora.json e servidor MCP.", "Garantias no runtime; 27.0.0-rc.4 publicada em 16 de novembro de 2026."),
]
h, gap = 1.45, 0.4
for i, (t, d, l1, l2) in enumerate(rows):
    y = 7.3 - (i + 1) * h - i * gap
    box(ax, 0.1, y, 11.8, h, t, l1, l2, hi=(t == "afora"), date=d)
    if i < 3: arrow(ax, (6, y), (6, y - gap))
fig.savefig("fig1.pdf", bbox_inches="tight"); fig.savefig("fig1.png", dpi=200, bbox_inches="tight")

# Figura 2
fig, ax = plt.subplots(figsize=(13.2, 6.0)); ax.set_xlim(0, 15); ax.set_ylim(0, 7.3); ax.axis("off")
for x, t in [(0.1, "Para agentes"), (5.4, "@afora/core"), (10.6, "Adaptadores")]:
    ax.text(x, 7.0, t, fontsize=11.5, fontweight="bold", color=SUB)
W, H, G = 4.4, 1.35, 0.35
ys = [6.45 - H - k * (H + G) for k in range(4)]
left = [("afora.json", "a aplicação descrita como dados"), ("@afora/mcp", "9 ferramentas para o agente"), ("@afora/codegen", "gera o TypeScript versionado")]
mid = [("Blueprints e properties", "validação, normalização, schema"), ("Entidades e repositórios", "unique, sensitive, change"),
       ("Casos de uso e commands", "passos, access, owner"), ("Outputs", "problem+json e OpenAPI")]
right = {1: ("Armazenamento", "memória, Drizzle, DynamoDB"), 2: ("Tempo real e telemetria", "WebSocket e OpenTelemetry"), 3: ("Servidores HTTP", "Hono, Fastify, Express, Elysia")}
for k, (t, s) in enumerate(left):
    box(ax, 0.1, ys[k], W, H, t, s)
    if k < 2: arrow(ax, (2.3, ys[k]), (2.3, ys[k] - G))
for k, (t, s) in enumerate(mid):
    box(ax, 5.4, ys[k], W, H, t, s, hi=True)
    if k < 3: arrow(ax, (7.6, ys[k]), (7.6, ys[k] - G))
for k, (t, s) in right.items():
    box(ax, 10.55, ys[k], W, H, t, s)
arrow(ax, (4.5, ys[2] + H / 2), (5.4, ys[2] + H / 2))
arrow(ax, (9.8, ys[1] + H / 2), (10.55, ys[1] + H / 2))
arrow(ax, (9.8, ys[3] + H / 2), (10.55, ys[3] + H / 2))
fig.savefig("fig2.pdf", bbox_inches="tight"); fig.savefig("fig2.png", dpi=200, bbox_inches="tight")
