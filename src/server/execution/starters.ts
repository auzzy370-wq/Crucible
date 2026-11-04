export type StarterFile = { path: string; content: string; language?: string };

export function starterFilesForChallenge(slug: string, language: string, track: string): StarterFile[] {
  const readme = `# ${slug}

Track: **${track}**
Language preference: **${language}**

This is your isolated Engineering Gauntlet workspace.
Build a working solution. Commit often. Tests and hidden evaluations run in a sandboxed worker.

## Rules
- Do not attempt to escape the sandbox or access platform secrets.
- AI tools are allowed; you are responsible for correctness and understanding.
- For cybersecurity labs: only attack the provided lab targets — never external systems.
`;

  const common: StarterFile[] = [
    { path: "README.md", content: readme, language: "markdown" },
    {
      path: "docs/ARCHITECTURE.md",
      content: `# Architecture Proposal\n\nDescribe components, trust boundaries, data stores, and failure modes.\n`,
      language: "markdown",
    },
  ];

  if (slug === "appsec-fortress") {
    return [
      ...common,
      {
        path: "lab/server.ts",
        content: `/**
 * CONTROLLED VULNERABLE LAB — NOT FOR PRODUCTION
 * Candidates must identify and fix issues. Do not deploy outside the sandbox.
 */
import http from "http";
import { URL } from "url";

const users: Record<string, { id: string; role: string; password: string }> = {
  alice: { id: "1", role: "user", password: "alice" },
  admin: { id: "2", role: "admin", password: "admin" },
};

const orders: Record<string, { id: string; userId: string; total: number }> = {
  "100": { id: "100", userId: "1", total: 42 },
  "200": { id: "200", userId: "2", total: 99 },
};

const comments: { user: string; body: string }[] = [];

function parseQs(reqUrl: string) {
  const u = new URL(reqUrl, "http://lab.local");
  return u;
}

const server = http.createServer(async (req, res) => {
  const u = parseQs(req.url || "/");
  // VULN-SQLI-01 style: naive filter (simulated)
  if (u.pathname === "/search") {
    const q = u.searchParams.get("q") || "";
    const hit = Object.values(orders).filter((o) =>
      // intentionally unsafe pattern for the lab
      String(o.id).includes(q) || q.includes("' OR "),
    );
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ hit, note: "fix this filter to parameterized logic" }));
    return;
  }
  // VULN-IDOR-01
  if (u.pathname.startsWith("/orders/")) {
    const id = u.pathname.split("/")[2];
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(orders[id] || null));
    return;
  }
  // VULN-XSS-01
  if (u.pathname === "/comments" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const data = JSON.parse(body || "{}");
      comments.push({ user: data.user || "anon", body: data.body || "" });
      res.writeHead(201, { "content-type": "text/html" });
      res.end(comments.map((c) => "<div>" + c.user + ": " + c.body + "</div>").join(""));
    });
    return;
  }
  // VULN-SSRF-01
  if (u.pathname === "/preview") {
    const target = u.searchParams.get("url") || "";
    try {
      const r = await fetch(target);
      const text = await r.text();
      res.writeHead(200, { "content-type": "text/plain" });
      res.end(text.slice(0, 500));
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
    return;
  }
  if (u.pathname === "/health") {
    res.writeHead(200);
    res.end("ok");
    return;
  }
  res.writeHead(404);
  res.end("not found");
});

server.listen(4050, () => console.log("lab on 4050"));
`,
        language: "typescript",
      },
      {
        path: "tests/public.test.ts",
        content: `import assert from "assert";

export async function runPublicTests() {
  const results: { name: string; pass: boolean; hidden?: boolean }[] = [];
  results.push({ name: "health endpoint documented", pass: true });
  results.push({ name: "lab server file present", pass: true });
  // Candidates expand this suite as they harden the lab
  assert.ok(results.every((r) => r.pass));
  return results;
}
`,
        language: "typescript",
      },
      {
        path: "tests/hidden.manifest.json",
        content: JSON.stringify(
          {
            tests: [
              { id: "hidden-idor", description: "Order access requires ownership", file: "orders" },
              { id: "hidden-ssrf", description: "Block link-local/metadata IPs", file: "preview" },
              { id: "hidden-xss", description: "Comments escaped", file: "comments" },
            ],
          },
          null,
          2,
        ),
        language: "json",
      },
      {
        path: "docs/FINDINGS.md",
        content: `# Findings\n\n| ID | Severity | Evidence | Fix |\n|----|----------|----------|-----|\n|    |          |          |     |\n`,
        language: "markdown",
      },
    ];
  }

  if (slug === "soc-nightwatch") {
    return [
      ...common,
      {
        path: "telemetry/alerts.json",
        content: JSON.stringify(
          [
            { id: "A-100", severity: "high", rule: "Impossible travel login", entity: "user:jlee" },
            { id: "A-101", severity: "medium", rule: "Outbound DNS volume spike", entity: "host:api-3" },
            { id: "A-102", severity: "low", rule: "Failed sudo", entity: "host:bastion" },
            { id: "A-103", severity: "critical", rule: "Service token used from new ASN", entity: "svc:billing" },
          ],
          null,
          2,
        ),
        language: "json",
      },
      {
        path: "playbooks/IR_TEMPLATE.md",
        content: `# Incident Timeline\n\n## Detection\n## Containment\n## Eradication\n## Recovery\n## Lessons Learned\n`,
        language: "markdown",
      },
      {
        path: "detections/rules.yaml",
        content: `rules: []\n# Add detection rules with unit-testable conditions\n`,
        language: "yaml",
      },
      {
        path: "tests/public.test.ts",
        content: `export async function runPublicTests() {
  return [{ name: "IR template present", pass: true }];
}
`,
        language: "typescript",
      },
    ];
  }

  if (track === "CYBERSECURITY") {
    const extras: StarterFile[] = [];
    if (slug === "cloud-bastion") {
      extras.push({
        path: "infra/baseline.tf",
        content: `# Harden this baseline — overly permissive for the lab\nresource "aws_security_group" "wide_open" {\n  ingress {\n    from_port   = 0\n    to_port     = 0\n    protocol    = "-1"\n    cidr_blocks = ["0.0.0.0/0"]\n  }\n}\n`,
        language: "hcl",
      });
    }
    if (slug === "detect-forge") {
      extras.push({
        path: "detections/sigma_stub.yml",
        content: `title: Suspicious token use\nstatus: experimental\nlogsource:\n  product: linux\ndetection:\n  selection:\n    EventID: 1\n  condition: selection\n`,
        language: "yaml",
      });
    }
    if (slug === "cipher-ops") {
      extras.push({
        path: "src/crypto_lab.ts",
        content: `// Broken constructions for the lab — replace with AEAD + vetted KDF\nexport function weakHash(pw: string) {\n  return Buffer.from(pw).toString("hex");\n}\n`,
        language: "typescript",
      });
    }
    if (slug === "zero-trust-edge") {
      extras.push({
        path: "policy/access.json",
        content: JSON.stringify(
          { default: "allow", routes: [{ path: "/**", auth: "none" }] },
          null,
          2,
        ),
        language: "json",
      });
    }
    if (slug === "threat-lattice") {
      extras.push({
        path: "docs/DFD.md",
        content: `# Data-flow diagram notes\n\n1. External user\n2. Edge gateway\n3. App services\n4. Datastores\n`,
        language: "markdown",
      });
    }
    return [
      ...common,
      ...extras,
      {
        path: "src/main.ts",
        content: `// Cybersecurity assessment entrypoint (${slug})\nexport function health() {\n  return { ok: true, track: "CYBERSECURITY", slug: "${slug}" };\n}\n`,
        language: "typescript",
      },
      {
        path: "tests/public.test.ts",
        content: `import { health } from "../src/main";
export async function runPublicTests() {
  const h = health();
  return [
    { name: "health", pass: !!h.ok },
    { name: "slug_bound", pass: h.slug === "${slug}" },
  ];
}
`,
        language: "typescript",
      },
      {
        path: "tests/hidden.manifest.json",
        content: JSON.stringify(
          {
            tests: [
              { id: "mitigation-evidence", description: "Primary mitigations implemented with tests" },
              { id: "no-critical-open", description: "No unresolved critical findings in lab scope" },
            ],
          },
          null,
          2,
        ),
        language: "json",
      },
      {
        path: "docs/THREAT_MODEL.md",
        content: `# Threat Model\n\n## Assets\n## Trust boundaries\n## STRIDE\n## Mitigations\n`,
        language: "markdown",
      },
      {
        path: "docs/FINDINGS.md",
        content: `# Findings\n\n| ID | Severity | Evidence | Fix |\n|----|----------|----------|-----|\n|    |          |          |     |\n`,
        language: "markdown",
      },
    ];
  }

  // Default software engineering starter (mini SaaS-shaped)
  return [
    ...common,
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: slug,
          private: true,
          type: "module",
          scripts: { test: "node --import tsx tests/run.ts", start: "node --import tsx src/server.ts" },
        },
        null,
        2,
      ),
      language: "json",
    },
    {
      path: "src/server.ts",
      content: `import http from "http";

const users = new Map<string, { email: string; password: string; role: string; orgId: string }>();

export function register(email: string, password: string, orgId: string) {
  if (users.has(email)) throw new Error("exists");
  users.set(email, { email, password, role: "member", orgId });
  return { email, orgId };
}

export function login(email: string, password: string) {
  const u = users.get(email);
  if (!u || u.password !== password) throw new Error("invalid");
  return { email: u.email, role: u.role, orgId: u.orgId, token: Buffer.from(email).toString("base64") };
}

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end("not found");
});

if (process.env.RUN_SERVER === "1") server.listen(4060);

export { server, users };
`,
      language: "typescript",
    },
    {
      path: "tests/public.test.ts",
      content: `import { register, login } from "../src/server";

export async function runPublicTests() {
  const results: { name: string; pass: boolean; hidden?: boolean }[] = [];
  try {
    register("a@ex.com", "pw", "org1");
    const session = login("a@ex.com", "pw");
    results.push({ name: "register_login", pass: session.orgId === "org1" });
  } catch {
    results.push({ name: "register_login", pass: false });
  }
  results.push({ name: "health_module_loads", pass: true });
  return results;
}
`,
      language: "typescript",
    },
    {
      path: "tests/hidden.manifest.json",
      content: JSON.stringify(
        {
          tests: [
            { id: "tenant-isolation", description: "Users cannot read other org resources" },
            { id: "idempotent-payment", description: "Duplicate payment intents do not double-charge" },
          ],
        },
        null,
        2,
      ),
      language: "json",
    },
    {
      path: "tests/run.ts",
      content: `import { runPublicTests } from "./public.test";
const results = await runPublicTests();
console.log(JSON.stringify({ results }));
process.exit(results.every((r) => r.pass) ? 0 : 1);
`,
      language: "typescript",
    },
    {
      path: "Dockerfile",
      content: `FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nCMD ["node", "--import", "tsx", "src/server.ts"]\n`,
      language: "dockerfile",
    },
  ];
}
