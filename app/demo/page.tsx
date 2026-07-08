import Image from "next/image";

const findings = [
  {
    title: "Accuracy may be misleading",
    severity: "High",
    text: "The notebook reports accuracy as a main metric, but the dataset appears imbalanced. Add recall, precision, F1-score and PR-AUC.",
  },
  {
    title: "Threshold choice not justified",
    severity: "Medium",
    text: "The project uses a default classification threshold. For fraud detection, the false negative / false positive trade-off should be explicitly discussed.",
  },
  {
    title: "Reproducibility could improve",
    severity: "Medium",
    text: "Random seeds and dependency versions are not clearly documented. Add a requirements file and fixed random_state values.",
  },
  {
    title: "Portfolio explanation is weak",
    severity: "Low",
    text: "The notebook has technical results, but the README should better explain the business problem, limitations and decision trade-offs.",
  },
];

const questions = [
  "Why is accuracy not enough for an imbalanced fraud detection problem?",
  "How did you ensure that SMOTE was not applied before the train/test split?",
  "What is worse in this use case: a false positive or a false negative?",
  "Why did you choose this threshold?",
  "How would your model behave on new fraud patterns?",
  "What would you improve if this project became a real production system?",
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

        <a
          href="/"
          className="rounded-full border border-blue-400/40 px-5 py-2 text-sm font-medium text-blue-100 transition hover:border-blue-300 hover:bg-blue-500/10"
        >
          Back home
        </a>
      </nav>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-4xl">
          <div className="mb-6 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-100">
            Sample ModelHawk Audit Report
          </div>

          <h1 className="text-5xl font-black tracking-tight md:text-7xl">
            Fraud Detection{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Notebook Audit
            </span>
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            This is an example of how ModelHawk would review a machine learning
            project before submission, interview or portfolio publishing.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <ScoreCard title="Overall risk" value="Medium-high" detail="Several evaluation and documentation issues found." />
          <ScoreCard title="Leakage risk" value="72%" detail="Potential workflow risks should be manually checked." />
          <ScoreCard title="Portfolio readiness" value="81%" detail="Strong project, but explanation needs improvement." />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-blue-950/70 backdrop-blur">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-blue-300">
                  Findings
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  Technical red flags
                </h2>
              </div>

              <div className="rounded-full bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-300">
                4 issues found
              </div>
            </div>

            <div className="grid gap-4">
              {findings.map((finding) => (
                <div
                  key={finding.title}
                  className="rounded-3xl border border-white/10 bg-[#050B18]/80 p-5 transition hover:-translate-y-1 hover:border-blue-300/40"
                >
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <h3 className="text-xl font-bold">{finding.title}</h3>
                    <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-300">
                      {finding.severity}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-300">
                    {finding.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              Viva Mode
            </p>
            <h2 className="mt-2 text-3xl font-black">
              Questions you should be ready to answer
            </h2>

            <div className="mt-6 grid gap-3">
              {questions.map((question, index) => (
                <div
                  key={question}
                  className="rounded-2xl border border-white/10 bg-[#020817]/70 p-4"
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
          </aside>
        </div>

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-blue-500/[0.08] p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-300">
            Improvement plan
          </p>
          <h2 className="mt-2 text-3xl font-black">
            What ModelHawk would recommend next
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ImprovementCard
              number="01"
              title="Fix evaluation"
              text="Add PR-AUC, recall, precision, F1-score and a threshold analysis."
            />
            <ImprovementCard
              number="02"
              title="Strengthen reproducibility"
              text="Add fixed seeds, requirements.txt and clear instructions to rerun the notebook."
            />
            <ImprovementCard
              number="03"
              title="Improve the README"
              text="Explain the problem, model limitations and business trade-offs in plain English."
            />
          </div>
        </section>
      </section>
    </main>
  );
}

function ScoreCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{detail}</p>
    </div>
  );
}

function ImprovementCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#050B18]/80 p-6">
      <p className="text-sm font-black text-blue-300">{number}</p>
      <h3 className="mt-3 text-xl font-bold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}