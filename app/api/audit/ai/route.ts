import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Finding = {
  severity: string;
  title: string;
  text: string;
};

type ProjectProfile = {
  primaryTask: string;
  secondaryTasks?: string[];
  dataModality: string;
  problemTraits?: string[];
  confidence: number;
  confidenceLabel: string;
  appliedPacks?: string[];
};

type SuggestedMarkdownCell = {
  title: string;
  where: string;
  text: string;
};

type AuditResult = {
  fileName: string;
  projectProfile?: ProjectProfile;
  summary: {
    totalCells: number;
    codeCells: number;
    markdownCells: number;
  };
  signals: Record<string, boolean>;
  scores: {
    leakageRisk: number;
    metricQuality: number;
    reproducibility: number;
    portfolioReadiness: number;
  };
  findings: Finding[];
  goodPractices?: string[];
  risksToVerify?: string[];
  priorityFixes?: string[];
  recommendations?: string[];
  suggestedMarkdownCells?: SuggestedMarkdownCell[];
  vivaQuestions: string[];
};

type AiNarrative = {
  executiveSummary: string;
  technicalAssessment: string;
  riskInterpretation: string;
  portfolioVerdict: string;
  improvedRecommendations: string[];
  suggestedMarkdownCells: SuggestedMarkdownCell[];
  vivaAnswers: {
    question: string;
    answer: string;
  }[];
  limitations: string[];
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

const OLLAMA_URL = process.env.OLLAMA_URL || "";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";

type AiProviderResult = {
  candidate: Partial<AiNarrative>;
  provider: "gemini" | "ollama" | "deterministic";
  model: string;
  warning?: string;
};

export async function POST(request: Request) {
  try {
    const auditResult = (await request.json()) as AuditResult;

    if (!auditResult || !auditResult.fileName || !auditResult.scores) {
      return NextResponse.json(
        {
          error:
            "Invalid audit result. This endpoint expects the JSON returned by /api/audit.",
        },
        { status: 400 }
      );
    }

    const providerResult = await generateAiCandidate(auditResult);
    const aiNarrative = buildControlledAiNarrative(
      providerResult.candidate,
      auditResult
    );

    return NextResponse.json({
      aiNarrative,
      provider: providerResult.provider,
      model: providerResult.model,
      warning: providerResult.warning,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown AI narrative generation error.";

    console.error("MODELHAWK AI ERROR:");
    console.error(message);

    return NextResponse.json(
      {
        error: message.slice(0, 3000),
      },
      { status: 500 }
    );
  }
}

async function generateAiCandidate(
  auditResult: AuditResult
): Promise<AiProviderResult> {
  const warnings: string[] = [];

  if (GEMINI_API_KEY) {
    try {
      return await generateWithGemini(auditResult);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("MODELHAWK GEMINI ERROR:");
      console.error(message);
      warnings.push(`Gemini failed: ${message.slice(0, 500)}`);
    }
  }

  if (OLLAMA_URL) {
    try {
      return await generateWithOllama(auditResult, warnings);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("MODELHAWK OLLAMA ERROR:");
      console.error(message);
      warnings.push(`Ollama failed: ${message.slice(0, 500)}`);
    }
  }

  return {
    candidate: {},
    provider: "deterministic",
    model: "modelhawk-controlled-fallback",
    warning:
      warnings.length > 0
        ? warnings.join(" | ")
        : "No GEMINI_API_KEY or OLLAMA_URL was configured. ModelHawk used the deterministic examiner fallback.",
  };
}

async function generateWithGemini(
  auditResult: AuditResult
): Promise<AiProviderResult> {
  const prompt = buildAiPrompt(auditResult);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_MODEL
  )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: MODELHAWK_AI_INSTRUCTIONS }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 3000,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini request failed. Model: ${GEMINI_MODEL}. Details: ${errorText}`
    );
  }

  const data = await response.json();
  const content = extractGeminiText(data);

  if (!content) {
    throw new Error("Gemini returned an empty or invalid response.");
  }

  return {
    candidate: parseAiCandidate(content),
    provider: "gemini",
    model: GEMINI_MODEL,
  };
}

async function generateWithOllama(
  auditResult: AuditResult,
  previousWarnings: string[]
): Promise<AiProviderResult> {
  const prompt = buildAiPrompt(auditResult);

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: AI_NARRATIVE_SCHEMA,
      options: {
        temperature: 0.1,
        num_ctx: 8192,
        num_predict: 3000,
      },
      messages: [
        {
          role: "system",
          content: MODELHAWK_AI_INSTRUCTIONS,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Ollama request failed.

Make sure:
1. Ollama is running.
2. The model is installed.
3. You can run this in PowerShell:
   ollama run ${OLLAMA_MODEL}

Model: ${OLLAMA_MODEL}
URL: ${OLLAMA_URL}

Details:
${errorText}`
    );
  }

  const data = await response.json();
  const content = data?.message?.content;

  if (!content || typeof content !== "string") {
    throw new Error("Ollama returned an empty or invalid response.");
  }

  return {
    candidate: parseAiCandidate(content),
    provider: "ollama",
    model: OLLAMA_MODEL,
    warning:
      previousWarnings.length > 0 ? previousWarnings.join(" | ") : undefined,
  };
}

function buildAiPrompt(auditResult: AuditResult) {
  const compactAudit = compactAuditResult(auditResult);

  return `Generate an AI-assisted ModelHawk narrative from this static audit JSON.

Return ONLY valid JSON matching the requested schema.

Critical rules:
- Use only the evidence in the audit JSON.
- Do not invent dataset details, model results, plots, code or metrics.
- Do not change numeric scores.
- Do not claim the notebook is correct.
- Do not claim the notebook is production-ready.
- Do not claim that a risk has already been solved unless the audit explicitly confirms it.
- Do not say "the notebook uses SMOTE only on training data". Say this must be verified.
- Do not say "the notebook does not explicitly state X" unless the audit JSON explicitly says that.
- Do not put notebook weaknesses inside "limitations" unless directly supported by the audit JSON.
- The "limitations" field must describe limitations of static analysis and the AI layer.
- You must answer every viva question from "vivaQuestions".

JSON_SCHEMA:
${JSON.stringify(AI_NARRATIVE_SCHEMA, null, 2)}

AUDIT_JSON:
${JSON.stringify(compactAudit, null, 2)}`;
}

function extractGeminiText(data: unknown) {
  const candidate = (data as {
    candidates?: {
      content?: {
        parts?: {
          text?: unknown;
        }[];
      };
    }[];
  })?.candidates?.[0];

  const parts = candidate?.content?.parts || [];
  const text = parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("\n")
    .trim();

  return text;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}


const MODELHAWK_AI_INSTRUCTIONS = `
You are ModelHawk's AI Examiner layer.

Your job:
Transform a deterministic static ML notebook audit into a clear, professional, technically useful narrative.

You must:
- Treat the audit JSON as the only source of truth.
- Never invent notebook content.
- Never invent scores, metrics, plots, results, code details, datasets or claims.
- Never say the notebook is correct.
- Never say the notebook is production-ready.
- Never claim that a review point has already been solved unless the audit explicitly confirms it.
- Make the report sound like a careful ML reviewer, not marketing copy.
- Explain why the detected signals matter.
- Distinguish between confirmed static evidence, review points to verify and suggested improvements.

For viva answers:
- Answer every original viva question.
- Use the detected audit context.
- Keep answers practical and defensible.
- Avoid unsupported certainty.

For limitations:
- Only describe limitations of the static audit and AI examiner layer.
- Do not invent new notebook weaknesses.

Style:
- English.
- Clear and concise.
- No hype.
- No unsupported claims.
- Use concrete ML terminology.
- Return JSON only.
`;

const AI_NARRATIVE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    executiveSummary: {
      type: "string",
    },
    technicalAssessment: {
      type: "string",
    },
    riskInterpretation: {
      type: "string",
    },
    portfolioVerdict: {
      type: "string",
    },
    improvedRecommendations: {
      type: "array",
      items: {
        type: "string",
      },
    },
    suggestedMarkdownCells: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: {
            type: "string",
          },
          where: {
            type: "string",
          },
          text: {
            type: "string",
          },
        },
        required: ["title", "where", "text"],
      },
    },
    vivaAnswers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: {
            type: "string",
          },
          answer: {
            type: "string",
          },
        },
        required: ["question", "answer"],
      },
    },
    limitations: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: [
    "executiveSummary",
    "technicalAssessment",
    "riskInterpretation",
    "portfolioVerdict",
    "improvedRecommendations",
    "suggestedMarkdownCells",
    "vivaAnswers",
    "limitations",
  ],
};

function compactAuditResult(result: AuditResult) {
  const activeSignals = Object.entries(result.signals || {})
    .filter(([, value]) => value === true)
    .map(([signal]) => signal);

  return {
    fileName: result.fileName,
    projectProfile: result.projectProfile || null,
    summary: result.summary,
    scores: result.scores,
    findings: result.findings || [],
    goodPractices: result.goodPractices || [],
    risksToVerify: result.risksToVerify || [],
    priorityFixes: result.priorityFixes || [],
    recommendations: result.recommendations || [],
    suggestedMarkdownCells: result.suggestedMarkdownCells || [],
    vivaQuestions: result.vivaQuestions || [],
    activeSignals,
  };
}

function parseAiCandidate(content: string): Partial<AiNarrative> {
  try {
    return JSON.parse(content) as Partial<AiNarrative>;
  } catch {
    const extractedJson = extractJsonObject(content);

    if (!extractedJson) return {};

    try {
      return JSON.parse(extractedJson) as Partial<AiNarrative>;
    } catch {
      return {};
    }
  }
}

function buildControlledAiNarrative(
  aiCandidate: Partial<AiNarrative>,
  auditResult: AuditResult
): AiNarrative {
  const deterministicExecutiveSummary = buildExecutiveSummary(auditResult);
  const deterministicTechnicalAssessment = buildTechnicalAssessment(auditResult);
  const deterministicRiskInterpretation = buildRiskInterpretation(auditResult);
  const deterministicPortfolioVerdict = buildPortfolioVerdict(auditResult);

  return {
    executiveSummary: deterministicExecutiveSummary,
    technicalAssessment: deterministicTechnicalAssessment,
    riskInterpretation: deterministicRiskInterpretation,
    portfolioVerdict: deterministicPortfolioVerdict,
    improvedRecommendations: buildRecommendations(aiCandidate, auditResult),
    suggestedMarkdownCells: buildMarkdownCells(aiCandidate, auditResult),
    vivaAnswers: buildVivaAnswers(auditResult),
    limitations: buildStaticAuditLimitations(),
  };
}

function selectSafeAiText(
  value: unknown,
  deterministicFallback: string,
  minLength: number
) {
  if (typeof value !== "string") return deterministicFallback;

  const text = value.trim();

  if (text.length < minLength) return deterministicFallback;
  if (!isSafeNarrativeText(text)) return deterministicFallback;

  return text;
}

function isSafeNarrativeText(text: string) {
  const lower = text.toLowerCase();

  const bannedPatterns = [
    "the notebook is correct",
    "the notebook is production-ready",
    "production-ready",
    "guarantees correctness",
    "guarantee correctness",
    "proves correctness",
    "prove correctness",
    "ensure robustness",
    "ensures robustness",
    "ensure reliability",
    "ensures reliability",
    "the notebook uses smote/resampling only",
    "the notebook uses smote only",
    "resampling only on the training data",
    "does not explicitly state",
    "does not explicitly address",
  ];

  return !bannedPatterns.some((pattern) => lower.includes(pattern));
}

function buildExecutiveSummary(auditResult: AuditResult) {
  const profile = auditResult.projectProfile;
  const task = profile?.primaryTask ? prettyLabel(profile.primaryTask) : "Unknown";
  const modality = profile?.dataModality
    ? prettyLabel(profile.dataModality)
    : "Unknown";

  const traits = profile?.problemTraits?.length
    ? profile.problemTraits.map(prettyLabel)
    : [];

  const traitText =
    traits.length > 0 ? ` The detected traits include ${toSentence(traits)}.` : "";

  const hasNoMajorRedFlags = auditResult.findings.some((finding) =>
    finding.title.toLowerCase().includes("no major static red flags")
  );

  const redFlagText = hasNoMajorRedFlags
    ? "No major static red flags were detected, but this remains a static review rather than proof of methodological correctness."
    : "The notebook still contains review points that should be checked manually.";

  return `ModelHawk identified this notebook as a ${task} project using ${modality} data.${traitText} The static audit produced a leakage risk score of ${auditResult.scores.leakageRisk}/100, metric quality of ${auditResult.scores.metricQuality}/100, reproducibility of ${auditResult.scores.reproducibility}/100 and portfolio readiness of ${auditResult.scores.portfolioReadiness}/100. ${redFlagText}`;
}

function buildTechnicalAssessment(auditResult: AuditResult) {
  const profile = auditResult.projectProfile;
  const task = profile?.primaryTask ? prettyLabel(profile.primaryTask) : "Unknown";
  const modality = profile?.dataModality
    ? prettyLabel(profile.dataModality)
    : "Unknown";

  const practices = auditResult.goodPractices || [];
  const selectedPractices = practices.slice(0, 8).map(removeTrailingPeriod);

  let text = `The notebook appears to be structured as a ${task} workflow over ${modality} data. ModelHawk detected ${auditResult.summary.totalCells} total cells, including ${auditResult.summary.codeCells} code cells and ${auditResult.summary.markdownCells} markdown cells, suggesting a mix of implementation and explanation.`;

  if (selectedPractices.length > 0) {
    text += ` Positive static signals include ${toSentence(selectedPractices)}.`;
  }

  if (hasTrait(auditResult, "imbalanced_data") || hasTrait(auditResult, "fraud_detection")) {
    text +=
      " Because the detected profile involves fraud detection or class imbalance, the evaluation strategy should focus on minority-class behaviour rather than headline accuracy alone.";
  }

  if (auditResult.signals?.usesThresholdTuning) {
    text +=
      " Threshold or probability-based decision logic was detected, so the final threshold choice should be explicitly justified.";
  }

  if (auditResult.signals?.usesSmote) {
    text +=
      " SMOTE or resampling signals were detected, which makes it important to verify that resampling is applied only inside the training workflow.";
  }

  if (auditResult.signals?.usesDeepLearningSignals) {
    text +=
      " Deep learning signals were detected, so validation curves, early stopping and overfitting checks should be clearly explained if neural models are part of the comparison.";
  }

  return text;
}

function buildRiskInterpretation(auditResult: AuditResult) {
  const risks = auditResult.risksToVerify || [];
  const leakageRisk = auditResult.scores.leakageRisk;
  const leakageLabel = leakageRiskLabel(leakageRisk);

  if (risks.length === 0) {
    return `ModelHawk did not return specific risks to verify. The leakage-risk score is ${leakageLabel} (${leakageRisk}/100), which is positive, but it does not prove that the workflow is correct because the notebook was not executed.`;
  }

  return `The risks identified by ModelHawk are review points, not confirmed errors. The leakage-risk score is ${leakageLabel} (${leakageRisk}/100). The most important checks are: ${toSentence(
    risks.map(removeTrailingPeriod)
  )}. These points matter because static analysis can detect likely workflow signals but cannot confirm exactly how the notebook behaves when executed.`;
}

function buildPortfolioVerdict(auditResult: AuditResult) {
  const profile = auditResult.projectProfile;
  const task = profile?.primaryTask ? prettyLabel(profile.primaryTask) : "ML";
  const modality = profile?.dataModality
    ? prettyLabel(profile.dataModality)
    : "unknown";

  const leakageRisk = auditResult.scores.leakageRisk;
  const leakageLabel = leakageRiskLabel(leakageRisk);

  if (
    auditResult.scores.metricQuality >= 80 &&
    auditResult.scores.reproducibility >= 75 &&
    auditResult.scores.portfolioReadiness >= 75
  ) {
    return `As a portfolio project, this notebook looks promising. It presents a clear ${task} use case with ${modality} data and strong static signals around evaluation, reproducibility and explanation. The leakage-risk score is ${leakageLabel} (${leakageRisk}/100), but the remaining review points should still be verified manually. The main improvement is to make the final model-selection logic, threshold choice, resampling safety and deployment limitations even easier to defend.`;
  }

  return `As a portfolio project, this notebook has useful foundations but would benefit from stronger explanation. The leakage-risk score is ${leakageLabel} (${leakageRisk}/100). The most important improvements are to clarify the evaluation objective, justify the final model choice and make the limitations easy to defend in an interview.`;
}

function buildRecommendations(
  aiCandidate: Partial<AiNarrative>,
  auditResult: AuditResult
) {
  const aiItems = Array.isArray(aiCandidate.improvedRecommendations)
    ? aiCandidate.improvedRecommendations.filter(
        (item) => typeof item === "string" && isSafeRecommendation(item)
      )
    : [];

  const items: string[] = [];

  if (hasTrait(auditResult, "imbalanced_data")) {
    items.push(
      "Make it explicit that final model selection should be driven by minority-class performance rather than accuracy alone."
    );
  }

  if (hasTrait(auditResult, "fraud_detection")) {
    items.push(
      "Explain the practical trade-off between catching more fraudulent transactions and reducing false alerts for legitimate users."
    );
  }

  if (auditResult.signals?.usesThresholdTuning) {
    items.push(
      "Justify the selected decision threshold and explain how it changes the balance between precision and recall."
    );
  }

  if (auditResult.signals?.usesSmote) {
    items.push(
      "Keep the SMOTE/resampling explanation close to the validation methodology so the reader can verify that resampling is applied only inside the training workflow."
    );
  }

  if (auditResult.signals?.usesBaseline) {
    items.push(
      "Strengthen the final discussion by comparing the selected model directly against the baseline."
    );
  }

  if (auditResult.signals?.usesDeepLearningSignals) {
    items.push(
      "Clarify whether neural networks are part of the final solution or used mainly as a comparison against classical machine learning models."
    );
  }

  items.push(
    "State the project type, target variable and evaluation objective clearly.",
    "Make dependency versions and rerun instructions easy to find.",
    "Connect the limitations section more directly to deployment risk, data drift and future validation."
  );

  return uniqueNormalised([...items, ...aiItems]).slice(0, 9);
}

function isSafeRecommendation(value: string) {
  const lower = value.toLowerCase();

  if (lower.includes("production-ready")) return false;
  if (lower.includes("guarantee")) return false;
  if (lower.includes("the notebook uses smote only")) return false;
  if (lower.includes("resampling only on the training data")) return false;
  if (lower.includes("does not explicitly")) return false;

  return true;
}

function buildMarkdownCells(
  aiCandidate: Partial<AiNarrative>,
  auditResult: AuditResult
) {
  const aiCells = Array.isArray(aiCandidate.suggestedMarkdownCells)
    ? aiCandidate.suggestedMarkdownCells
        .filter(Boolean)
        .map((cell) => ({
          title: String(cell.title || "Suggested notebook improvement"),
          where: String(cell.where || "Relevant notebook section"),
          text: String(cell.text || ""),
        }))
        .filter(
          (cell) =>
            cell.title.trim().length > 0 &&
            cell.where.trim().length > 0 &&
            cell.text.trim().length > 80 &&
            isSafeNarrativeText(cell.text)
        )
    : [];

  const cells: SuggestedMarkdownCell[] = [
    ...(auditResult.suggestedMarkdownCells || []),
  ];

  if (hasTrait(auditResult, "fraud_detection")) {
    cells.push({
      title: "Fraud detection cost trade-off",
      where: "Before the final model selection or conclusion",
      text:
        "In fraud detection, false positives and false negatives have different practical consequences. A false negative may allow a fraudulent transaction to pass undetected, while a false positive may inconvenience a legitimate customer or create additional review workload. For this reason, the final threshold and model choice should be linked to the desired balance between fraud capture and operational cost.",
    });
  }

  if (auditResult.signals?.usesSmote) {
    cells.push({
      title: "Resampling and leakage control",
      where: "Near the validation methodology section",
      text:
        "Any resampling method such as SMOTE should be applied only to the training data within the validation workflow. Applying resampling before the train/test split can leak information into the test set and make performance estimates overly optimistic. The notebook should make clear where resampling is applied and how the held-out test set remains untouched.",
    });
  }

  if (auditResult.signals?.usesThresholdTuning) {
    cells.push({
      title: "Decision threshold rationale",
      where: "Near the evaluation or final model section",
      text:
        "The default probability threshold may not be optimal for an imbalanced fraud detection problem. The selected threshold should be justified using precision, recall, F1-score, PR-AUC or a cost-sensitive objective, depending on whether the project prioritises catching more fraud cases or reducing false alerts.",
    });
  }

  if (auditResult.signals?.usesDeepLearningSignals) {
    cells.push({
      title: "Role of neural network models",
      where: "Near the model comparison section",
      text:
        "If neural networks are included, their role should be clearly explained. They may be candidate final models or benchmarks against classical machine learning approaches. The final selection should be justified using validation performance, minority-class metrics, overfitting behaviour and interpretability considerations.",
    });
  }

  return uniqueMarkdownCells([...cells, ...aiCells]).slice(0, 5);
}

function buildVivaAnswers(auditResult: AuditResult) {
  return (auditResult.vivaQuestions || []).map((question) => ({
    question,
    answer: buildDeterministicVivaAnswer(question, auditResult),
  }));
}

function buildDeterministicVivaAnswer(
  question: string,
  auditResult: AuditResult
) {
  const lower = question.toLowerCase();

  if (lower.includes("accuracy")) {
    return "Accuracy is not enough because the detected project profile involves imbalanced classification and fraud detection. In that context, a model can achieve high overall accuracy while still missing many minority-class cases. Precision, recall, F1-score and PR-AUC are more informative because they focus on the fraud class and on the precision-recall trade-off.";
  }

  if (lower.includes("resampling") || lower.includes("smote")) {
    return "I would verify that resampling is applied only to the training data and ideally inside the validation workflow. If SMOTE or any similar method is applied before the train/test split, synthetic information can leak into the test set and make the results overly optimistic. The held-out test set should remain untouched until final evaluation.";
  }

  if (lower.includes("threshold")) {
    if (auditResult.signals?.usesThresholdTuning) {
      return "ModelHawk detected threshold or probability-based decision logic, so I would explain the threshold as a deliberate modelling choice rather than using the default 0.5 blindly. In fraud detection, lowering the threshold can improve recall and catch more fraud cases, but it can also increase false positives. The chosen threshold should therefore be justified using precision, recall, F1-score, PR-AUC or an explicit cost trade-off.";
    }

    return "The decision threshold should be chosen according to the project objective rather than blindly using 0.5. In fraud detection, lowering the threshold may improve recall and catch more fraud cases, but it can also increase false positives. The chosen threshold should therefore be justified using precision, recall, F1-score, PR-AUC or an explicit cost trade-off.";
  }

  if (lower.includes("precision") && lower.includes("recall")) {
    return "If precision and recall move in opposite directions, the priority depends on the practical cost of each error. For fraud detection, recall is often important because missing fraud can be costly, but precision also matters because too many false alerts can create operational burden and affect legitimate users. The final choice should be linked to the business or risk objective.";
  }

  if (lower.includes("generalises") || lower.includes("generalizes")) {
    return "Generalisation should be tested using held-out data, cross-validation where appropriate and, ideally, more recent or external data. For fraud detection, it is also important to consider data drift because fraud patterns can change over time. Strong validation should check that the model is not only fitting the current dataset but remains reliable under changing conditions.";
  }

  if (lower.includes("limitations")) {
    return "The main limitations to discuss are that notebook-level validation does not prove real-world reliability, fraud patterns may change over time, the selected threshold may depend on operational costs, and additional validation would be needed before any deployment decision. The notebook should connect these limitations to future work such as external validation, monitoring and data-drift checks.";
  }

  return "This answer should be grounded in the notebook evidence. I would explain the modelling choice by referring to the detected task, validation strategy, selected metrics, model comparison, leakage controls and limitations, rather than relying on a single headline score.";
}

function buildStaticAuditLimitations() {
  return [
    "This AI examiner layer uses the static ModelHawk audit as evidence and does not execute the notebook.",
    "The configured AI provider can improve wording and interpretation, but it cannot prove that the methodology is correct.",
    "The audit can detect code and markdown signals, but manual review is still needed to verify data leakage, metric calculation and validation design.",
    "The generated text should be treated as technical guidance, not as a guarantee of model quality or deployment readiness.",
  ];
}

function extractJsonObject(value: string) {
  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return value.slice(firstBrace, lastBrace + 1);
}

function hasTrait(auditResult: AuditResult, trait: string) {
  return Boolean(
    auditResult.projectProfile?.problemTraits?.some(
      (item) => item.toLowerCase() === trait.toLowerCase()
    )
  );
}

function removeTrailingPeriod(value: string) {
  return value.replace(/\.$/, "");
}

function uniqueNormalised(values: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const clean = String(value || "").trim();

    if (!clean) continue;

    const key = normaliseTextKey(clean);

    if (seen.has(key)) continue;

    seen.add(key);
    output.push(clean);
  }

  return output;
}

function uniqueMarkdownCells(cells: SuggestedMarkdownCell[]) {
  const seen = new Set<string>();
  const output: SuggestedMarkdownCell[] = [];

  for (const cell of cells) {
    const cleanCell = {
      title: String(cell.title || "").trim(),
      where: String(cell.where || "").trim(),
      text: String(cell.text || "").trim(),
    };

    if (!cleanCell.title || !cleanCell.where || !cleanCell.text) continue;

    const key = normaliseTextKey(`${cleanCell.title} ${cleanCell.where}`);

    if (seen.has(key)) continue;

    seen.add(key);
    output.push(cleanCell);
  }

  return output;
}

function normaliseTextKey(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toSentence(items: string[]) {
  const clean = items.filter(Boolean);

  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;

  return `${clean.slice(0, -1).join(", ")} and ${clean[clean.length - 1]}`;
}

function leakageRiskLabel(value: number) {
  if (value <= 25) return "low";
  if (value < 60) return "moderate";
  return "high";
}

function prettyLabel(value: string) {
  return String(value || "unknown")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

