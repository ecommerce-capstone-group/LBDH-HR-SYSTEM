import { Router, type IRouter } from "express";
import { db, applicants, jobs } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateApplicantBody } from "@workspace/api-zod";
import type { ApplicantAiEvaluation, Requirement, RequirementMatch } from "@workspace/db";

const router: IRouter = Router();

const GEMINI_DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

type GeminiModel = {
  name?: string;
  supportedGenerationMethods?: string[];
};

async function pickSupportedGeminiModel(apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const resp = await fetch(url, { method: "GET" });
  if (!resp.ok) {
    const bodyText = await resp.text().catch(() => "");
    throw new Error(`Gemini listModels error (${resp.status}): ${bodyText || resp.statusText}`);
  }
  const data = (await resp.json()) as { models?: GeminiModel[] };
  const models = Array.isArray(data.models) ? data.models : [];

  const supportsGenerate = (m: GeminiModel) =>
    typeof m.name === "string" &&
    Array.isArray(m.supportedGenerationMethods) &&
    m.supportedGenerationMethods.includes("generateContent");

  const preferred =
    models.find((m) => supportsGenerate(m) && (m.name as string).includes("gemini") && (m.name as string).includes("flash")) ??
    models.find((m) => supportsGenerate(m) && (m.name as string).includes("gemini")) ??
    models.find((m) => supportsGenerate(m));

  if (!preferred?.name) throw new Error("No Gemini model supports generateContent for this API key");
  // API returns names like "models/gemini-xxx" — we need the suffix for the generateContent URL.
  return preferred.name.startsWith("models/") ? preferred.name.slice("models/".length) : preferred.name;
}

type MatchStatus = "full" | "partial" | "none";

function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function uniqueNonEmpty(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const text = raw.trim();
    if (!text) continue;
    const key = normalizeKey(text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function jobQualificationCategories(job: { description?: string | null; requirements?: Requirement[] | null }): string[] {
  const descLines = uniqueNonEmpty(String(job.description || "").split(/\r?\n/g));
  const reqLabels = uniqueNonEmpty(
    (Array.isArray(job.requirements) ? job.requirements : [])
      .map((r) => r.label)
      .filter((label) => label.trim().toLowerCase() !== "meets posted qualifications"),
  );
  // Posted jobs use one qualification per description line; seeded jobs use structured requirement labels.
  if (descLines.length >= 2) return descLines.slice(0, 30);
  if (reqLabels.length > 0) return reqLabels.slice(0, 30);
  if (descLines.length > 0) return descLines.slice(0, 30);
  return ["Overall fit for the posted role"];
}

/** Split 100 into n nearly-equal percentages that always sum to 100. */
function equalWeights(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [100];
  const cents = Array.from({ length: n }, () => Math.floor(10000 / n));
  let rem = 10000 - cents[0]! * n;
  for (let i = 0; i < rem; i++) cents[i] = (cents[i] ?? 0) + 1;
  return cents.map((c) => c / 100);
}

function parseStatus(raw: unknown, met: boolean): MatchStatus {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (s === "full" || s === "met" || s === "yes") return "full";
  if (s === "partial" || s === "some") return "partial";
  if (s === "none" || s === "not_met" || s === "no") return "none";
  return met ? "full" : "none";
}

function fulfillment(status: MatchStatus): number {
  if (status === "full") return 1;
  if (status === "partial") return 0.5;
  return 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildScoredEvaluation(args: {
  categories: string[];
  rawMatches: Array<{
    requirement?: unknown;
    met?: unknown;
    status?: unknown;
    confidence?: unknown;
    evidence?: unknown;
  }>;
  model: string;
}): ApplicantAiEvaluation {
  const weights = equalWeights(args.categories.length);
  const byKey = new Map<string, (typeof args.rawMatches)[number]>();
  for (const m of args.rawMatches) {
    if (typeof m.requirement === "string" && m.requirement.trim()) {
      byKey.set(normalizeKey(m.requirement), m);
    }
  }

  const matches: ApplicantAiEvaluation["matches"] = args.categories.map((requirement, i) => {
    const raw = byKey.get(normalizeKey(requirement)) ?? args.rawMatches[i];
    const met = raw?.met === true;
    const status = parseStatus(raw?.status, met);
    const confidenceRaw = typeof raw?.confidence === "number" ? raw.confidence : status === "full" ? 1 : status === "partial" ? 0.5 : 0;
    const confidence = Math.min(1, Math.max(0, confidenceRaw));
    const evidence =
      typeof raw?.evidence === "string" && raw.evidence.trim()
        ? raw.evidence.trim()
        : status === "none"
          ? "No supporting evidence found in the resume, skills, or experience."
          : "Evidence was not provided.";
    const weightPercent = weights[i] ?? 0;
    const pointsAwarded = round2(fulfillment(status) * weightPercent);
    return {
      requirement,
      met: status === "full",
      status,
      confidence,
      evidence,
      weightPercent,
      pointsAwarded,
    };
  });

  const score = Math.min(100, Math.max(0, round2(matches.reduce((sum, m) => sum + (m.pointsAwarded ?? 0), 0))));
  const n = matches.length;
  const each = n > 0 ? (weights[0] ?? 0) : 0;
  const full = matches.filter((m) => m.status === "full");
  const partial = matches.filter((m) => m.status === "partial");
  const none = matches.filter((m) => m.status === "none");
  const fullPts = round2(full.reduce((s, m) => s + (m.pointsAwarded ?? 0), 0));
  const partialPts = round2(partial.reduce((s, m) => s + (m.pointsAwarded ?? 0), 0));

  const scoringExplanation =
    n === 0
      ? "No qualifications were available to score."
      : [
          `${n} qualification${n === 1 ? "" : "s"}, each worth ${each.toFixed(2)}% of the total (equal weight, summing to 100%).`,
          `Full match (${full.length}): ${fullPts}%. Partial match (${partial.length}, half credit): ${partialPts}%. Not met (${none.length}): 0%.`,
          `Total: ${fullPts} + ${partialPts} + 0 = ${score}%.`,
          none.length
            ? `Not met: ${none.map((m) => m.requirement).join("; ")}.`
            : "Every qualification received at least partial credit.",
        ].join(" ");

  const missingNames = none.map((m) => m.requirement);
  const summary = [
    `AI resume match is ${score}% out of 100.`,
    `Each of the ${n} qualifications counts equally (~${each.toFixed(1)}%).`,
    `${full.length} fully met, ${partial.length} partial, ${none.length} not met.`,
    missingNames.length ? `Gaps: ${missingNames.join("; ")}.` : "No unmet qualifications.",
  ].join(" ");

  return {
    score,
    summary,
    matches,
    model: args.model,
    evaluatedAt: new Date().toISOString(),
    categoryCount: n,
    scoringExplanation,
  };
}

function assertAiEvaluation(value: unknown): asserts value is ApplicantAiEvaluation {
  if (!value || typeof value !== "object") throw new Error("AI evaluation is not an object");
  const v = value as any;
  if (typeof v.score !== "number" || v.score < 0 || v.score > 100) throw new Error("AI score must be 0-100");
  if (typeof v.summary !== "string" || !v.summary.trim()) throw new Error("AI summary is missing");
  if (!Array.isArray(v.matches)) throw new Error("AI matches must be an array");
  for (const m of v.matches) {
    if (!m || typeof m !== "object") throw new Error("AI match item is invalid");
    if (typeof (m as any).requirement !== "string" || !(m as any).requirement.trim()) {
      throw new Error("AI match requirement is missing");
    }
    if (typeof (m as any).met !== "boolean") throw new Error("AI match met must be boolean");
    const c = (m as any).confidence;
    if (typeof c !== "number" || c < 0 || c > 1) throw new Error("AI match confidence must be 0-1");
    if (typeof (m as any).evidence !== "string" || !(m as any).evidence.trim()) {
      throw new Error("AI match evidence is missing");
    }
  }
  if (typeof v.model !== "string" || !v.model.trim()) throw new Error("AI model is missing");
  if (typeof v.evaluatedAt !== "string" || !v.evaluatedAt.trim()) throw new Error("AI evaluatedAt is missing");
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

const GEMINI_GENERATION_CONFIG = {
  temperature: 0,
  topP: 0,
  topK: 1,
  candidateCount: 1,
  seed: 0,
};

async function runGeminiAiEvaluation(args: {
  model: string;
  apiKey: string;
  jobTitle: string;
  jobDepartment: string;
  requirements: string[];
  applicantName: string;
  skills: string;
  experience: string;
  resume: string;
}): Promise<ApplicantAiEvaluation> {
  const { model, apiKey } = args;
  const makeUrl = (m: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(
      apiKey,
    )}`;

  const numberedReqs = args.requirements.map((r, i) => `${i + 1}. ${r}`).join("\n");
  const n = args.requirements.length;

  const systemInstruction =
    "You are an HR screening assistant. Judge ONLY the listed qualifications, in the given order. " +
    "Do not use protected attributes (age, gender, religion, etc.). Do not guess missing information. " +
    "Do not invent extra qualifications. Do not compute an overall score.";

  const userPrompt = `Return ONLY valid JSON (no markdown, no backticks) matching this schema:
{
  "matches": [
    {
      "requirement": string, // copy the qualification text EXACTLY
      "status": "full" | "partial" | "none",
      "met": boolean, // true only when status is "full"
      "confidence": number, // 0 to 1, certainty of this judgment
      "evidence": string // quote/paraphrase from resume/skills/experience, or what is missing
    }
  ]
}

Rules:
- Return exactly ${n} match objects, one per qualification, same order.
- status "full": resume/skills/experience clearly satisfy the qualification.
- status "partial": some relevant evidence, but not enough to fully meet it.
- status "none": missing, contradicted, or cannot be verified.
- Be consistent: the same resume and qualifications must produce the same statuses.

Job:
Title: ${args.jobTitle}
Department: ${args.jobDepartment}

Qualifications (equal weight; the server will score them):
${numberedReqs}

Applicant:
Name: ${args.applicantName}
Skills:
${args.skills}

Experience:
${args.experience}

Resume (text):
${args.resume}
`;

  const payload = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: GEMINI_GENERATION_CONFIG,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    let activeModel = model;
    let resp = await fetch(makeUrl(activeModel), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (resp.status === 404) {
      activeModel = await pickSupportedGeminiModel(apiKey);
      resp = await fetch(makeUrl(activeModel), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    }

    if (!resp.ok) {
      const bodyText = await resp.text().catch(() => "");
      throw new Error(`Gemini error (${resp.status}): ${bodyText || resp.statusText}`);
    }

    const data = (await resp.json()) as any;
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("\n") ??
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || typeof text !== "string") {
      throw new Error("Gemini returned empty response text");
    }

    const jsonText = extractJsonObject(text) ?? text.trim();
    const parsed = JSON.parse(jsonText);
    const rawMatches = Array.isArray(parsed?.matches) ? parsed.matches : [];
    const enriched = buildScoredEvaluation({
      categories: args.requirements,
      rawMatches,
      model: activeModel,
    });
    assertAiEvaluation(enriched);
    return enriched;
  } finally {
    clearTimeout(timeout);
  }
}

router.get("/applicants", async (req, res) => {
  try {
    const raw = req.query.jobId;
    const jobId =
      raw !== undefined && raw !== "" ? Number(raw) : undefined;
    if (jobId !== undefined && !Number.isFinite(jobId)) {
      return res.status(400).json({ error: "Invalid jobId" });
    }
    const rows = await db
      .select()
      .from(applicants)
      .where(jobId ? eq(applicants.jobId, jobId) : undefined)
      .orderBy(desc(applicants.totalScore));
    res.json(rows);
  } catch (err) {
    console.error("list applicants failed", err);
    res.status(500).json({
      error:
        "Could not load applicants. Run database migration (pnpm db:push or scripts/migrate-applicants-email-phone.sql).",
    });
  }
});

router.get("/applicants/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db.select().from(applicants).where(eq(applicants.id, id));
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

router.post("/applicants", async (req, res) => {
  try {
    const body = CreateApplicantBody.parse(req.body);
    const [job] = await db.select().from(jobs).where(eq(jobs.id, body.jobId));
    if (!job) return res.status(404).json({ error: "Job not found" });

    const reqs = (job.requirements as Requirement[]) ?? [];
    const answersByLabel = new Map<string, boolean | number>();
    for (const a of body.answers) answersByLabel.set(a.label, a.value);

    let total = 0;
    const matches: RequirementMatch[] = [];
    for (const r of reqs) {
      const value = answersByLabel.get(r.label);
      let score = 0;
      if (r.kind === "checkbox") {
        const checked = value === true;
        score = checked ? r.weight : 0;
      } else if (r.kind === "number") {
        const num = typeof value === "number" ? value : 0;
        const max = r.max && r.max > 0 ? r.max : 1;
        const ratio = Math.min(num / max, 1);
        score = ratio * r.weight;
      }
      total += score;
      matches.push({
        label: r.label,
        kind: r.kind,
        value: value ?? (r.kind === "checkbox" ? false : 0),
        score: Math.round(score * 100) / 100,
        weight: r.weight,
      });
    }
    const totalScore = Math.min(Math.round(total * 100) / 100, 100);

    if (job.status !== "active") {
      return res.status(400).json({ error: "This job is no longer accepting applications" });
    }

    const [row] = await db
      .insert(applicants)
      .values({
        jobId: body.jobId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        skills: body.skills,
        experience: body.experience,
        resume: body.resume,
        totalScore,
        matches,
      })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    console.error("create applicant failed", err);
    if (err instanceof Error && err.name === "ZodError") {
      return res.status(400).json({ error: "Invalid application data" });
    }
    res.status(500).json({
      error:
        "Could not save application. Run database migration (pnpm db:push or scripts/migrate-applicants-email-phone.sql).",
    });
  }
});

router.post("/applicants/:id/ai-score", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Missing GEMINI_API_KEY on server. Add it to environment variables and restart the API server.",
      });
    }

    const [applicant] = await db.select().from(applicants).where(eq(applicants.id, id));
    if (!applicant) return res.status(404).json({ error: "Applicant not found" });

    if (applicant.aiEvaluation) {
      try {
        assertAiEvaluation(applicant.aiEvaluation);
        const scored = applicant.aiEvaluation.matches.every(
          (m) => typeof m.weightPercent === "number" && typeof m.pointsAwarded === "number",
        );
        if (scored) return res.json(applicant);
      } catch {
        // Stored evaluation is incomplete; re-run once and persist.
      }
    }

    const [job] = await db.select().from(jobs).where(eq(jobs.id, applicant.jobId));
    if (!job) return res.status(404).json({ error: "Job not found" });

    const uniqueReqs = jobQualificationCategories({
      description: job.description,
      requirements: Array.isArray(job.requirements) ? (job.requirements as Requirement[]) : [],
    });

    const evaluation = await runGeminiAiEvaluation({
      model: GEMINI_DEFAULT_MODEL,
      apiKey,
      jobTitle: job.title,
      jobDepartment: job.department,
      requirements: uniqueReqs,
      applicantName: applicant.name,
      skills: applicant.skills,
      experience: applicant.experience,
      resume: applicant.resume,
    });

    const [updated] = await db
      .update(applicants)
      .set({
        aiScore: evaluation.score,
        aiEvaluation: evaluation,
        aiUpdatedAt: new Date(),
      })
      .where(eq(applicants.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    console.error("ai-score applicant failed", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Could not run AI scoring" });
  }
});

router.delete("/applicants/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(applicants).where(eq(applicants.id, id));
  res.status(204).end();
});

export default router;
