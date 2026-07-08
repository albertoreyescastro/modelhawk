import Image from "next/image";

const scoreCards = [
  {
    title: "Leakage risk",
    value: "8/100",
    tone: "Low",
    detail:
      "Low static leakage-risk score, with remaining review points to verify manually.",
  },
  {
    title: "Metric quality",
    value: "92/100",
    tone: "Strong",
    detail:
      "Strong metric coverage detected, including PR-AUC, ROC-AUC, precision, recall and F1-style evaluation.",
  },
  {
    title: "Reproducibility",
    value: "90/100",
    tone: "Strong",
    detail:
      "Random-state, validation and workflow-structure signals were detected.",
  },
  {
    title: "Portfolio readiness",
    value: "92/100",
    tone: "Strong",
    detail:
      "The notebook has substantial explanation, limitations, business context and technical discussion.",
  },
];

const profileItems = [
  {
    label: "Primary task",
    value: "Classification",
  },
  {
    label: "Data modality",
    value: "Tabular",
  },
  {
    label: "Confidence",
    value: "High · 84/100",
  },
  {
    label: "Notebook structure",
    value: "196 cells · 80 code · 116 markdown",
  },
];

const problemTraits = [
  "Imbalanced Data",
  "Fraud Detection",
  "Threshold / Cost Sensitive",
  "Deep Learning Signals",
  "Anomaly / Rare Event Context",
];

const goodPractices = [
  "Clear train/test split signal detected.",
  "Stratified split detected, useful for imbalanced classification.",
  "Pipeline or ColumnTransformer detected, reducing preprocessing leakage risk.",
  "Cross-validation or advanced validation signal detected.",
  "Random seed or random_state detected.",
  "PR-AUC or precision-recall evaluation detected.",
  "ROC-AUC evaluation detected.",
  "Precision, recall or F1-style evaluation detected.",
  "Threshold or probability-based decision logic detected.",
  "Hyperparameter search detected.",
  "Baseline comparison signal detected.",
  "Accuracy limitation appears to be acknowledged and supported by stronger metrics.",
  "Resampling/leakage awareness detected in the notebook explanation.",
  "Limitations or future work section detected.",
  "Business/cost context detected.",
  "Substantial markdown explanation detected.",
];

const risksToVerify = [
  "Verify that SMOTE/resampling is applied only to the training data in every experiment and cross-validation workflow.",
  "Verify that the final conclusion prioritises minority-class performance rather than accuracy alone.",
  "Metric coverage looks strong statically, but verify that metrics are calculated on held-out data only.",
];

const aiRecommendations = [
  "Make final model selection explicitly driven by minority-class performance rather than accuracy alone.",
  "Explain the practical trade-off between catching fraudulent transactions and reducing false alerts.",
  "Justify the selected decision threshold and explain how it changes the precision/recall balance.",
  "Keep the SMOTE/resampling explanation close to the validation methodology.",
  "Compare the selected model directly against the baseline.",
  "Clarify whether neural networks are part of the final solution or mainly a comparison point.",
];

const markdownImprovements = [
  {
    title: "Final metric justification",
    where: "Before the final model selection or conclusion",
    text:
      "Explain why precision, recall, F1-score and PR-AUC are more informative than accuracy alone for fraud detection.",
  },
  {
    title: "Fraud detection cost trade-off",
    where: "Before the final model selection or conclusion",
    text:
      "Connect false positives and false negatives to practical consequences such as missed fraud, customer friction and review workload.",
  },
  {
    title: "Resampling and leakage control",
    where: "Near the validation methodology section",
    text:
      "Make clear that SMOTE or any resampling method should be applied only inside the training workflow.",
  },
  {
    title: "Decision threshold rationale",
    where: "Near the evaluation or final model section",
    text:
      "Justify the selected probability threshold using precision, recall, F1-score, PR-AUC or a cost-sensitive objective.",
  },
];

const vivaAnswers = [
  {
    question: "Why is accuracy not enough for this project?",
    answer:
      "Because the detected project profile involves imbalanced classification and fraud detection. A model can achieve high accuracy while missing minority-class fraud cases, so precision, recall, F1-score and PR-AUC are more informative.",
  },
  {
    question: "How did you make sure resampling did not create leakage?",
    answer:
      "Resampling should be verified as training-only and ideally inside the validation workflow. If SMOTE is applied before the train/test split, synthetic information can leak into the test set.",
  },
  {
    question: "How did you choose your decision threshold?",
    answer:
      "The threshold should be treated as a modelling choice rather than blindly using 0.5. In fraud detection, lowering the threshold can improve recall but may increase false positives.",
  },
  {
    question:
      "Which metric would you prioritise if precision and recall move in opposite directions?",
    answer:
      "The priority depends on the practical cost of each error. Fraud detection often values recall, but precision still matters because too many false alerts create operational burden.",
  },
  {
    question: "How would you test whether this model generalises to new data?",
    answer:
      "Use held-out data, cross-validation where appropriate and ideally more recent or external data. Fraud patterns can change over time, so data drift should also be considered.",
  },
  {
    question: "What are the main limitations of this project?",
    answer:
      "Notebook-level validation does not prove real-world reliability. Fraud patterns may change, the selected threshold depends on operational costs, and further validation would be needed before deployment.",
  },
];

const technicalSignals = [
  "Accuracy limitation acknowledged",
  "Resampling safety discussed",
  "Train/test split",
  "Train/validation split",
  "Stratification",
  "Pipeline / ColumnTransformer",
  "SMOTE",
  "Cross-validation",
  "Random state",
  "PR-AUC",
  "ROC-AUC",
  "Precision / Recall / F1",
  "Threshold tuning",
  "Baseline comparison",
  "Hyperparameter search",
  "Deep learning signals",
  "Early stopping",
  "Learning curves",
  "Business context",
  "Limitations section",
];

export default function DemoPage() {
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
              Sample Audit
            </p>
          </div>
        </a>

        <div className="flex items-center gap-3">
          <a
            href="/upload"
            className="hidden rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white sm:inline-block"
          >
            Run your own audit
          </a>

          <a
            href="/"
            className="rounded-full border border-blue-400/40 px-5 py-2 text-sm font-medium text-blue-100 transition hover:border-blue-300 hover:bg-blue-500/10"
          >
            Back home
          </a>
        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-100">
              Real sample audit · Credit card fraud detection notebook
            </div>

            <h1 className="text-5xl font-black tracking-tight md:text-7xl">
              See how{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                ModelHawk
              </span>{" "}
              reviews an ML notebook.
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              This demo mirrors the output generated from a credit card fraud
              detection notebook. ModelHawk detects the project profile,
              evaluates static ML workflow signals, highlights risks to verify,
              generates local AI examiner notes and prepares viva-style answer
              guidance.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/upload"
                className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-7 py-3 text-center text-sm font-bold text-[#020817] shadow-xl shadow-blue-500/30 transition hover:scale-105"
              >
                Upload a notebook
              </a>

              <a
                href="/docs/reports/modelhawk-sample-audit-report.pdf"
                className="rounded-full border border-blue-400/40 px-7 py-3 text-center text-sm font-bold text-blue-100 transition hover:bg-blue-500/10"
              >
                Open sample PDF
              </a>

              <a
                href="/examples/credit_card_fraud_detection.ipynb"
                className="rounded-full border border-white/10 px-7 py-3 text-center text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                Download demo notebook
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-blue-950/80 backdrop-blur">
            <div className="rounded-[1.5rem] bg-[#050B18] p-6">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-300">
                Detected project profile
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Classification · Tabular · Fraud Detection
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                The notebook is recognised as an imbalanced fraud detection
                workflow with threshold-sensitive evaluation and rare-event
                modelling signals.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {profileItems.map((item) => (
                  <ProfileTile
                    key={item.label}
                    label={item.label}
                    value={item.value}
                  />
                ))}
              </div>

              <div className="mt-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Problem traits
                </p>

                <div className="flex flex-wrap gap-2">
                  {problemTraits.map((trait) => (
                    <span
                      key={trait}
                      className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-slate-300"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {scoreCards.map((score) => (
            <ScoreCard key={score.title} {...score} />
          ))}
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <Panel
            eyebrow="Static audit result"
            title="Good practices detected"
            description="These are positive static signals found in the notebook. They do not prove correctness, but they indicate stronger project structure."
          >
            <div className="grid gap-3">
              {goodPractices.map((item) => (
                <SignalCard key={item} tone="good" text={item} />
              ))}
            </div>
          </Panel>

          <Panel
            eyebrow="Review points"
            title="Risks to verify"
            description="These are not confirmed errors. They are the checks a reviewer should still verify manually."
          >
            <div className="grid gap-3">
              {risksToVerify.map((item) => (
                <SignalCard key={item} tone="warning" text={item} />
              ))}
            </div>
          </Panel>
        </section>

        <section className="mt-12 rounded-[2rem] border border-purple-300/20 bg-purple-300/10 p-6 shadow-2xl shadow-purple-950/30 backdrop-blur">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-purple-300">
                Local AI examiner notes
              </p>
              <h2 className="mt-2 text-3xl font-black">
                Technical interpretation generated from the audit JSON
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                The local AI layer uses the deterministic ModelHawk audit as
                evidence. It improves explanation, but does not prove the
                notebook is correct.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-300/20 bg-[#020817]/60 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Provider
              </p>
              <p className="mt-1 font-black text-purple-200">
                Ollama · Local AI
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {aiRecommendations.map((item, index) => (
              <RecommendationCard
                key={item}
                number={index + 1}
                text={item}
              />
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel
            eyebrow="Notebook improvements"
            title="Suggested markdown cells"
            description="These are the kinds of explanatory cells ModelHawk would suggest adding to make the notebook easier to defend."
          >
            <div className="grid gap-4">
              {markdownImprovements.map((cell) => (
                <MarkdownSuggestion key={cell.title} {...cell} />
              ))}
            </div>
          </Panel>

          <Panel
            eyebrow="Viva mode"
            title="Questions and answer guidance"
            description="ModelHawk prepares interview-style questions and concise technical answers based on the detected project profile."
          >
            <div className="grid gap-4">
              {vivaAnswers.map((item, index) => (
                <VivaCard key={item.question} index={index + 1} {...item} />
              ))}
            </div>
          </Panel>
        </section>

        <section className="mt-12 rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6 backdrop-blur">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
            Detected technical signals
          </p>
          <h2 className="mt-2 text-3xl font-black">
            What ModelHawk found in the notebook
          </h2>

          <div className="mt-6 flex flex-wrap gap-2">
            {technicalSignals.map((signal) => (
              <span
                key={signal}
                className="rounded-full border border-white/10 bg-[#020817]/70 px-3 py-1 text-xs font-medium text-slate-300"
              >
                {signal}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-blue-500/[0.08] p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-300">
            Try the workflow
          </p>
          <h2 className="mx-auto mt-2 max-w-3xl text-4xl font-black">
            Upload your own notebook and generate a full ModelHawk report.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            The full upload workflow can produce static audit scores, local AI
            examiner notes, suggested markdown improvements, viva preparation
            and a professional PDF report.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="/upload"
              className="rounded-full bg-white px-7 py-3 text-sm font-bold text-[#020817] transition hover:scale-105"
            >
              Run an audit
            </a>

            <a
              href="/"
              className="rounded-full border border-blue-400/40 px-7 py-3 text-sm font-bold text-blue-100 transition hover:bg-blue-500/10"
            >
              Back to landing page
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}

function Panel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-blue-950/40 backdrop-blur">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-300">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-black">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ScoreCard({
  title,
  value,
  tone,
  detail,
}: {
  title: string;
  value: string;
  tone: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur transition hover:-translate-y-1 hover:border-blue-300/40">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-sm text-slate-400">{title}</p>
        <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
          {tone}
        </span>
      </div>
      <p className="text-4xl font-black text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{detail}</p>
    </div>
  );
}

function ProfileTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-bold text-white">{value}</p>
    </div>
  );
}

function SignalCard({
  tone,
  text,
}: {
  tone: "good" | "warning";
  text: string;
}) {
  const styles =
    tone === "good"
      ? "border-green-300/20 bg-green-400/10 text-green-100"
      : "border-yellow-300/20 bg-yellow-400/10 text-yellow-100";

  return (
    <div className={`rounded-2xl border p-4 text-sm leading-6 ${styles}`}>
      {text}
    </div>
  );
}

function RecommendationCard({
  number,
  text,
}: {
  number: number;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-300">
        Recommendation {number.toString().padStart(2, "0")}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

function MarkdownSuggestion({
  title,
  where,
  text,
}: {
  title: string;
  where: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
      <h3 className="font-bold text-white">{title}</h3>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-300">
        Where: {where}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

function VivaCard({
  index,
  question,
  answer,
}: {
  index: number;
  question: string;
  answer: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
      <p className="text-sm font-bold leading-6 text-cyan-200">
        Q{index}. {question}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{answer}</p>
    </div>
  );
}
