"use client";

import Image from "next/image";
import { useState, type ChangeEvent, type ReactNode } from "react";

type Finding = {
  severity: string;
  title: string;
  text: string;
};

type ProjectProfile = {
  primaryTask: string;
  secondaryTasks: string[];
  dataModality: string;
  problemTraits: string[];
  confidence: number;
  confidenceLabel: string;
  appliedPacks: string[];
};

type SuggestedMarkdownCell = {
  title: string;
  where: string;
  text: string;
};

type AiVivaAnswer = {
  question: string;
  answer: string;
};

type AiNarrative = {
  executiveSummary: string;
  technicalAssessment: string;
  riskInterpretation: string;
  portfolioVerdict: string;
  improvedRecommendations: string[];
  suggestedMarkdownCells: SuggestedMarkdownCell[];
  vivaAnswers: AiVivaAnswer[];
  limitations: string[];
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

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [aiNarrative, setAiNarrative] = useState<AiNarrative | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiProviderNotice, setAiProviderNotice] = useState("");

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setResult(null);
    setAiNarrative(null);
    setError("");
    setAiError("");
    setAiProviderNotice("");
  }

  async function handleStartScan() {
    if (!selectedFile) return;

    setLoading(true);
    setAiLoading(false);
    setError("");
    setAiError("");
    setAiProviderNotice("");
    setResult(null);
    setAiNarrative(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/audit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult(data);
      setLoading(false);

      await generateAiNarrative(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The notebook could not be analysed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function generateAiNarrative(auditData: AuditResult) {
    setAiLoading(true);
    setAiError("");
    setAiProviderNotice("");

    try {
      const response = await fetch("/api/audit/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(auditData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI examiner generation failed.");
      }

      setAiNarrative(data.aiNarrative);

      const warnings = Array.isArray(data.warnings) ? data.warnings : [];
      const provider = typeof data.provider === "string" ? data.provider : "";
      const model = typeof data.model === "string" ? data.model : "";

      if (warnings.length > 0 || provider === "ollama" || provider === "deterministic") {
        let providerLabel = "fallback examiner";

        if (provider === "ollama") {
          providerLabel = "Ollama fallback" + (model ? " (" + model + ")" : "");
        } else if (provider === "deterministic") {
          providerLabel = "deterministic fallback examiner";
        }

        setAiProviderNotice(
          "The primary AI provider was temporarily unavailable, so ModelHawk used the " +
            providerLabel +
            ". The deterministic static audit still completed successfully."
        );
      } else {
        setAiProviderNotice("");
      }
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : "The AI examiner notes could not be generated."
      );
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,#1677FF33,transparent_35%),radial-gradient(circle_at_20%_20%,#5EEBFF22,transparent_30%),linear-gradient(180deg,#020817_0%,#061126_50%,#020817_100%)]" />

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-lg shadow-blue-500/25">
            <Image
              src="/modelhawk-icon.png"
              alt="ModelHawk icon"
              width={48}
              height={48}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <div>
            <p className="text-xl font-bold tracking-tight">
              Model<span className="text-blue-400">Hawk</span>
            </p>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
              Upload Notebook
            </p>
          </div>
        </a>

        <div className="flex items-center gap-3">
          <a
            href="/demo"
            className="hidden rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white sm:inline-block"
          >
            Sample demo
          </a>

          <a
            href="/"
            className="rounded-full border border-blue-400/40 px-5 py-2 text-sm font-medium text-blue-100 transition hover:border-blue-300 hover:bg-blue-500/10"
          >
            Back home
          </a>
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid max-w-7xl items-start gap-12 px-6 py-16 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-100">
            Static audit + AI examiner
          </div>

          <h1 className="text-5xl font-black tracking-tight md:text-7xl">
            Upload your{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              ML notebook.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            ModelHawk reads your notebook, detects the project profile, applies
            technical audit checks and then uses a AI examiner layer to
            generate richer project-specific explanations.
          </p>

          <div className="mt-8 grid gap-3 text-sm text-slate-400">
            <InfoBox text="This version does not execute your notebook. It performs static analysis." />
            <InfoBox text="It detects project type, data modality, ML signals, risks, good practices and suggested notebook improvements." />
            <InfoBox text="The AI examiner notes are generated by the configured AI provider using the audit result as evidence." />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-blue-950/80 backdrop-blur">
          <div className="rounded-[1.5rem] bg-[#050B18] p-6">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-blue-300">
              Notebook upload
            </p>

            <h2 className="text-3xl font-black">Start a ModelHawk audit</h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Upload a Jupyter notebook file. ModelHawk will parse it, return
              technical signals, generate risk scores and add AI examiner
              notes.
            </p>

            <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-blue-300/40 bg-blue-500/10 p-10 text-center transition hover:border-cyan-300/70 hover:bg-blue-500/15">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 text-3xl">
                ↑
              </div>

              <p className="text-lg font-bold">Choose a .ipynb notebook</p>

              <p className="mt-2 text-sm text-slate-400">
                Select a notebook from your computer
              </p>

              <input
                type="file"
                accept=".ipynb"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {selectedFile && (
              <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                <p className="text-sm font-semibold text-cyan-200">
                  Selected file
                </p>
                <p className="mt-2 break-all text-sm text-slate-300">
                  {selectedFile.name}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
                <p className="text-sm font-semibold text-red-200">Error</p>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-300">
                  {error}
                </p>
              </div>
            )}

            <button
              onClick={handleStartScan}
              disabled={!selectedFile || loading || aiLoading}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-8 py-4 font-bold text-[#020817] shadow-xl shadow-blue-500/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              {loading
                ? "Analysing notebook..."
                : aiLoading
                ? "Generating AI examiner notes..."
                : "Run static audit"}
            </button>

            {loading && <NotebookAnalysingPanel />}

            {result && (
              <AuditResults
                result={result}
                aiNarrative={aiNarrative}
                aiLoading={aiLoading}
                aiError={aiError}
                aiProviderNotice={aiProviderNotice}
                onRegenerateAi={() => generateAiNarrative(result)}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function AuditResults({
  result,
  aiNarrative,
  aiLoading,
  aiError,
  aiProviderNotice,
  onRegenerateAi,
}: {
  result: AuditResult;
  aiNarrative: AiNarrative | null;
  aiLoading: boolean;
  aiError: string;
  aiProviderNotice: string;
  onRegenerateAi: () => void;
}) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const activeSignals = Object.entries(result.signals).filter(
    ([, value]) => value === true
  );

  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.05] p-5">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-300">
        ModelHawk result
      </p>

      <h3 className="mt-3 text-2xl font-black">Audit generated</h3>

      <p className="mt-3 break-all text-sm leading-6 text-slate-300">
        File analysed:{" "}
        <span className="font-semibold text-white">{result.fileName}</span>
      </p>

      {result.projectProfile && (
        <ProjectProfileCard profile={result.projectProfile} />
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <MiniStat label="Total cells" value={result.summary.totalCells} />
        <MiniStat label="Code cells" value={result.summary.codeCells} />
        <MiniStat label="Markdown cells" value={result.summary.markdownCells} />
      </div>

      <div className="mt-6 grid gap-4">
        <ScoreBar
          label="Leakage risk"
          value={result.scores.leakageRisk}
          riskMode
        />
        <ScoreBar label="Metric quality" value={result.scores.metricQuality} />
        <ScoreBar
          label="Reproducibility"
          value={result.scores.reproducibility}
        />
        <ScoreBar
          label="Portfolio readiness"
          value={result.scores.portfolioReadiness}
        />
      </div>

      <ResultSection title="Findings" accent="blue">
        <div className="grid gap-3">
          {result.findings.map((finding) => (
            <FindingCard key={finding.title} finding={finding} />
          ))}
        </div>
      </ResultSection>

      <ResultList
        title="Good practices detected"
        items={result.goodPractices}
        emptyText="No specific good-practice signals were returned by the current audit."
        variant="good"
      />

      <ResultList
        title="Risks to verify"
        items={result.risksToVerify}
        emptyText="No additional risks to verify were returned by the current audit."
        variant="warning"
      />

      <ResultList
        title="Priority fixes"
        items={result.priorityFixes}
        emptyText="No priority fixes were returned by the current audit."
        variant="danger"
      />

      <ResultList
        title="Recommendations"
        items={result.recommendations}
        emptyText="No extra recommendations were returned by the current audit."
        variant="neutral"
      />

      <SuggestedMarkdownSection cells={result.suggestedMarkdownCells} />

      <AiExaminerPanel
        aiNarrative={aiNarrative}
        loading={aiLoading}
        error={aiError}
        providerNotice={aiProviderNotice}
        onRegenerate={onRegenerateAi}
      />

      <ResultSection title="Detected signals" accent="cyan">
        <div className="flex flex-wrap gap-2">
          {activeSignals.length > 0 ? (
            activeSignals.map(([signal]) => (
              <span
                key={signal}
                className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-slate-300"
              >
                {formatSignal(signal)}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-400">
              No positive signals detected.
            </span>
          )}
        </div>
      </ResultSection>

      <ResultSection title="Viva questions" accent="cyan">
        <div className="grid gap-3">
          {result.vivaQuestions.map((question, index) => (
            <div
              key={question}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4"
            >
              <p className="text-sm leading-6 text-slate-300">
                <span className="mr-2 font-bold text-cyan-300">
                  Q{index + 1}.
                </span>
                {question}
              </p>
            </div>
          ))}
        </div>
      </ResultSection>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href="/demo"
          className="rounded-full border border-blue-400/40 px-6 py-3 text-center text-sm font-bold text-blue-100 transition hover:bg-blue-500/10"
        >
          View sample report
        </a>

        <button
          onClick={() => downloadPdfReport(result, setPdfLoading, aiNarrative)}
          disabled={pdfLoading}
          className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#020817] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {pdfLoading ? "Generating PDF..." : "Download PDF report"}
        </button>
      </div>

      {pdfLoading && <PdfGeneratingPanel />}
    </div>
  );
}

function AiExaminerPanel({
  aiNarrative,
  loading,
  error,
  providerNotice,
  onRegenerate,
}: {
  aiNarrative: AiNarrative | null;
  loading: boolean;
  error: string;
  providerNotice: string;
  onRegenerate: () => void;
}) {
  return (
    <ResultSection title="AI examiner notes" accent="cyan">
      <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h4 className="text-xl font-black text-white">
              AI technical review
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Generated by your configured AI provider using the deterministic
              ModelHawk audit as evidence.
            </p>
          </div>

          <button
            onClick={onRegenerate}
            disabled={loading}
            className="rounded-full border border-cyan-300/40 px-5 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Generating..." : "Regenerate notes"}
          </button>
        </div>

        {providerNotice && !error && (
          <div className="mb-4 rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-4">
            <p className="text-sm font-semibold text-yellow-100">AI provider notice</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{providerNotice}</p>
          </div>
        )}

        {loading && <AiGeneratingPanel />}

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-200">
              AI examiner error
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && !aiNarrative && (
          <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-400">
            AI examiner notes have not been generated yet.
          </div>
        )}

        {aiNarrative && (
          <div className="grid gap-4">
            <AiTextCard
              title="Executive summary"
              text={aiNarrative.executiveSummary}
            />

            <AiTextCard
              title="Technical assessment"
              text={aiNarrative.technicalAssessment}
            />

            <AiTextCard
              title="Risk interpretation"
              text={aiNarrative.riskInterpretation}
            />

            <AiTextCard
              title="Portfolio verdict"
              text={aiNarrative.portfolioVerdict}
            />

            <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
              <h5 className="font-bold text-white">
                Improved recommendations
              </h5>

              <div className="mt-3 grid gap-2">
                {aiNarrative.improvedRecommendations.length > 0 ? (
                  aiNarrative.improvedRecommendations.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-slate-300"
                    >
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    No AI recommendations were returned.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
              <h5 className="font-bold text-white">
                AI suggested markdown cells
              </h5>

              <div className="mt-3 grid gap-3">
                {aiNarrative.suggestedMarkdownCells.length > 0 ? (
                  aiNarrative.suggestedMarkdownCells.map((cell, index) => (
                    <SuggestedMarkdownCard
                      key={`${cell.title}-${index}`}
                      cell={cell}
                    />
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    No AI markdown cells were returned.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
              <h5 className="font-bold text-white">Suggested viva answers</h5>

              <div className="mt-3 grid gap-3">
                {aiNarrative.vivaAnswers.length > 0 ? (
                  aiNarrative.vivaAnswers.map((item, index) => (
                    <div
                      key={`${item.question}-${index}`}
                      className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4"
                    >
                      <p className="text-sm font-bold leading-6 text-cyan-200">
                        Q{index + 1}. {item.question}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">
                        {item.answer}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    No AI viva answers were returned.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4">
              <h5 className="font-bold text-yellow-100">
                AI examiner limitations
              </h5>

              <div className="mt-3 grid gap-2">
                {aiNarrative.limitations.length > 0 ? (
                  aiNarrative.limitations.map((item) => (
                    <p key={item} className="text-sm leading-6 text-yellow-100">
                      • {item}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-yellow-100">
                    No limitations were returned.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ResultSection>
  );
}

function AiTextCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
      <h5 className="font-bold text-white">{title}</h5>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">
        {text}
      </p>
    </div>
  );
}

function AiGeneratingPanel() {
  return (
    <div
      className="mb-4 rounded-2xl border border-cyan-300/20 bg-[#020817]/70 p-4"
      aria-live="polite"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-cyan-200">
            Generating AI examiner notes...
          </p>
          <p className="mt-1 text-xs text-slate-400">
            The configured AI provider is reading the audit JSON and writing a technical review.
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-200 border-t-transparent" />
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-500" />
      </div>
    </div>
  );
}

function ProjectProfileCard({ profile }: { profile: ProjectProfile }) {
  return (
    <div className="mt-6 rounded-3xl border border-blue-300/20 bg-blue-500/10 p-5">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-300">
            Detected project profile
          </p>
          <h4 className="mt-2 text-2xl font-black text-white">
            {prettyLabel(profile.primaryTask)}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            ModelHawk inferred this profile from notebook code, markdown,
            imports, metrics and ML workflow signals.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Confidence
          </p>
          <p className="mt-1 font-black text-cyan-200">
            {profile.confidenceLabel} · {profile.confidence}/100
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ProfileItem
          label="Primary task"
          value={prettyLabel(profile.primaryTask)}
        />
        <ProfileItem
          label="Data modality"
          value={prettyLabel(profile.dataModality)}
        />
      </div>

      {profile.secondaryTasks?.length > 0 && (
        <ChipGroup
          title="Secondary tasks"
          items={profile.secondaryTasks.map(prettyLabel)}
        />
      )}

      {profile.problemTraits?.length > 0 && (
        <ChipGroup
          title="Problem traits"
          items={profile.problemTraits.map(prettyLabel)}
        />
      )}

      {profile.appliedPacks?.length > 0 && (
        <ChipGroup
          title="Applied audit packs"
          items={profile.appliedPacks.map(prettyLabel)}
        />
      )}
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020817]/60 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-bold text-white">{value}</p>
    </div>
  );
}

function ChipGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-slate-300"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="font-bold text-white">{finding.title}</h4>
        <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-300">
          {finding.severity}
        </span>
      </div>
      <p className="text-sm leading-6 text-slate-300">{finding.text}</p>
    </div>
  );
}

function ResultSection({
  title,
  children,
  accent = "blue",
}: {
  title: string;
  children: ReactNode;
  accent?: "blue" | "cyan";
}) {
  return (
    <div className="mt-8">
      <p
        className={`text-sm font-bold uppercase tracking-[0.25em] ${
          accent === "cyan" ? "text-cyan-300" : "text-blue-300"
        }`}
      >
        {title}
      </p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ResultList({
  title,
  items,
  emptyText,
  variant,
}: {
  title: string;
  items?: string[];
  emptyText: string;
  variant: "good" | "warning" | "danger" | "neutral";
}) {
  const safeItems = items || [];

  const styles = {
    good: "border-green-300/20 bg-green-400/10 text-green-200",
    warning: "border-yellow-300/20 bg-yellow-400/10 text-yellow-200",
    danger: "border-red-300/20 bg-red-400/10 text-red-200",
    neutral: "border-white/10 bg-[#020817]/70 text-slate-300",
  };

  return (
    <ResultSection title={title} accent={variant === "good" ? "cyan" : "blue"}>
      <div className="grid gap-3">
        {safeItems.length > 0 ? (
          safeItems.map((item) => (
            <div
              key={item}
              className={`rounded-2xl border p-4 text-sm leading-6 ${styles[variant]}`}
            >
              {item}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-400">
            {emptyText}
          </div>
        )}
      </div>
    </ResultSection>
  );
}

function SuggestedMarkdownSection({
  cells,
}: {
  cells?: SuggestedMarkdownCell[];
}) {
  const safeCells = cells || [];

  return (
    <ResultSection title="Suggested markdown cells" accent="cyan">
      <div className="grid gap-4">
        {safeCells.length > 0 ? (
          safeCells.map((cell, index) => (
            <SuggestedMarkdownCard
              key={`${cell.title}-${index}`}
              cell={cell}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-400">
            No suggested markdown cells were returned by the current audit.
          </div>
        )}
      </div>
    </ResultSection>
  );
}

function SuggestedMarkdownCard({ cell }: { cell: SuggestedMarkdownCell }) {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(`### ${cell.title}\n\n${cell.text}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("Could not copy text.");
    }
  }

  return (
    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
      <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h4 className="font-bold text-white">{cell.title}</h4>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-300">
            Where: {cell.where}
          </p>
        </div>

        <button
          onClick={copyText}
          className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#020817] transition hover:scale-105"
        >
          {copied ? "Copied" : "Copy text"}
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
        <p className="whitespace-pre-line text-sm leading-6 text-slate-300">
          {cell.text}
        </p>
      </div>
    </div>
  );
}

function NotebookAnalysingPanel() {
  return (
    <div className="mt-5 rounded-3xl border border-blue-300/20 bg-blue-500/10 p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-blue-200">
            Analysing notebook...
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Parsing cells, scanning ML patterns and preparing the audit.
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-300/30 bg-blue-300/10">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-transparent" />
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-500" />
      </div>

      <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#020817]/50 p-3">
          Reading notebook
        </div>
        <div className="rounded-2xl bg-[#020817]/50 p-3">
          Detecting signals
        </div>
        <div className="rounded-2xl bg-[#020817]/50 p-3">
          Building audit
        </div>
      </div>
    </div>
  );
}

function PdfGeneratingPanel() {
  return (
    <div
      className="mt-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5"
      aria-live="polite"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-cyan-200">
            Generating professional PDF report...
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Compiling LaTeX document. This may take a few seconds.
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-200 border-t-transparent" />
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-500" />
      </div>

      <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#020817]/50 p-3">
          Building report
        </div>
        <div className="rounded-2xl bg-[#020817]/50 p-3">
          Running pdflatex
        </div>
        <div className="rounded-2xl bg-[#020817]/50 p-3">
          Preparing download
        </div>
      </div>
    </div>
  );
}

function InfoBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      {text}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  riskMode = false,
}: {
  label: string;
  value: number;
  riskMode?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold text-white">
          {value}/100{riskMode ? " risk" : ""}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function formatSignal(signal: string) {
  return signal
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

function prettyLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function downloadPdfReport(
  result: AuditResult,
  setPdfLoading: (value: boolean) => void,
  aiNarrative: AiNarrative | null
) {
  setPdfLoading(true);

  try {
    const response = await fetch("/api/report/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auditResult: result,
        aiNarrative: aiNarrative ?? null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error || "PDF generation failed. Please try again."
      );
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const safeName = result.fileName
      .replace(/\.ipynb$/i, "")
      .replace(/[^a-z0-9-_]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();

    const link = document.createElement("a");
    link.href = url;
    link.download = `modelhawk-audit-${safeName || "notebook"}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "PDF generation failed. Please try again.";

    alert(message);
  } finally {
    setPdfLoading(false);
  }
}