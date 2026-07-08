import Image from "next/image";

const checks = [
  {
    title: "Notebook Parsing",
    description:
      "Extract code cells, markdown, imports, metrics, model workflow and project structure from your notebook.",
    label: "Parser",
  },
  {
    title: "Technical Checks",
    description:
      "Run rule-based checks for leakage risks, weak metrics, missing seeds, poor validation and suspicious ML patterns.",
    label: "Checks",
  },
  {
    title: "Risk Scoring",
    description:
      "Convert objective signals into scores for leakage risk, metric quality, reproducibility and portfolio readiness.",
    label: "Scoring",
  },
  {
    title: "AI Defense Report",
    description:
      "Use AI to explain the findings, generate viva questions and turn the audit into clear portfolio-ready feedback.",
    label: "AI layer",
  },
];

const steps = [
  {
    title: "Upload your ML notebook",
    text: "Start with a .ipynb file from Kaggle, university coursework, bootcamp work or a portfolio project.",
  },
  {
    title: "ModelHawk scans the workflow",
    text: "The system extracts technical signals before any AI-generated feedback is written.",
  },
  {
    title: "Get a defense-ready audit",
    text: "Receive risks, explanations, viva questions and concrete fixes before someone else reviews your work.",
  },
];

const pipeline = [
  "Parse notebook structure",
  "Extract ML workflow",
  "Detect leakage patterns",
  "Check metrics and validation",
  "Score technical risk",
  "Generate defense report",
];

const comparisons = [
  {
    generic: "Generic AI feedback",
    modelhawk:
      "Structured notebook audit with repeatable technical checks and scoring.",
  },
  {
    generic: "Reads what you paste",
    modelhawk:
      "Parses code, markdown, metrics, workflow order and project documentation.",
  },
  {
    generic: "Gives broad advice",
    modelhawk:
      "Flags concrete risks like SMOTE before split, missing seeds or unsupported conclusions.",
  },
  {
    generic: "One-off chat response",
    modelhawk:
      "Produces a reusable audit report for submissions, interviews and portfolio improvement.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020817] text-white">
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
              ML Audit
            </p>
          </div>
        </a>

        <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#pipeline" className="transition hover:text-white">
            Pipeline
          </a>
          <a href="/demo" className="transition hover:text-white">
            Demo
          </a>
          <a href="/upload" className="transition hover:text-white">
            Upload
          </a>
          <a href="#waitlist" className="transition hover:text-white">
            Early access
          </a>
        </div>

        <a
          href="/upload"
          className="rounded-full border border-blue-400/40 px-5 py-2 text-sm font-medium text-blue-100 transition hover:border-blue-300 hover:bg-blue-500/10"
        >
          Upload notebook
        </a>
      </nav>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-14 lg:grid-cols-2 lg:pt-24">
        <div>
          <div className="mb-8 inline-flex rounded-3xl bg-white p-3 shadow-2xl shadow-blue-500/20">
            <Image
              src="/modelhawk-wordmark.png"
              alt="ModelHawk logo"
              width={280}
              height={110}
              className="h-auto w-56 object-contain md:w-72"
              priority
            />
          </div>

          <div className="mb-6 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-100 shadow-lg shadow-blue-500/10">
            Not another AI wrapper — a technical ML examiner
          </div>

          <h1 className="max-w-3xl text-5xl font-black tracking-tight md:text-7xl">
            Spot the flaws before{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              they do.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Upload your machine learning notebook and get a structured technical
            audit for leakage risks, weak metrics, reproducibility issues,
            unsupported conclusions, viva questions and portfolio-ready fixes.
          </p>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
            ModelHawk does not simply ask an AI to “review your notebook”. It
            first extracts objective signals from your project, runs targeted ML
            checks, scores the risks and then uses AI to explain the findings
            clearly.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <a
              href="/demo"
              className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-8 py-4 text-center font-bold text-[#020817] shadow-xl shadow-blue-500/30 transition hover:scale-105"
            >
              Try sample audit
            </a>

            <a
              href="/upload"
              className="rounded-full border border-white/15 bg-white/5 px-8 py-4 text-center font-bold text-white backdrop-blur transition hover:scale-105 hover:bg-white/10"
            >
              Upload notebook
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-400">
            <span className="rounded-full bg-white/5 px-4 py-2">Parser</span>
            <span className="rounded-full bg-white/5 px-4 py-2">Leakage</span>
            <span className="rounded-full bg-white/5 px-4 py-2">Metrics</span>
            <span className="rounded-full bg-white/5 px-4 py-2">
              Reproducibility
            </span>
            <span className="rounded-full bg-white/5 px-4 py-2">
              Viva Mode
            </span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-blue-950/80 backdrop-blur transition hover:scale-[1.01]">
          <div className="rounded-[1.5rem] bg-[#050B18] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">ModelHawk Audit Report</p>
                <h2 className="text-2xl font-bold">
                  Fraud Detection Notebook
                </h2>
              </div>

              <div className="rounded-full bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-300">
                Medium-high risk
              </div>
            </div>

            <div className="grid gap-4">
              <AuditRow label="Leakage risk" value={72} />
              <AuditRow label="Metric quality" value={64} />
              <AuditRow label="Reproducibility" value={58} />
              <AuditRow label="Portfolio readiness" value={81} />
            </div>

            <div className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
              <p className="text-sm font-semibold text-blue-200">
                Hawk finding
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Accuracy is reported as a main metric, but the dataset appears
                imbalanced. Add recall, precision, F1, PR-AUC and threshold
                justification.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
              <p className="text-sm font-semibold text-cyan-200">
                Viva question
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Why did you choose this threshold, and what happens if false
                negatives are ten times more expensive?
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-semibold text-slate-200">
                Detected signals
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="rounded-full bg-blue-500/10 px-3 py-1">
                  uses accuracy
                </span>
                <span className="rounded-full bg-blue-500/10 px-3 py-1">
                  no threshold tuning
                </span>
                <span className="rounded-full bg-blue-500/10 px-3 py-1">
                  imbalanced problem
                </span>
                <span className="rounded-full bg-blue-500/10 px-3 py-1">
                  weak reproducibility
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="relative z-10 mx-auto max-w-7xl px-6 py-20"
      >
        <div className="mb-12 max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-blue-300">
            What it actually does
          </p>
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">
            Not a notebook checker. A technical examiner.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            ModelHawk checks whether your project would survive a technical
            defense, not just whether the notebook runs.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {checks.map((item) => (
            <div
              key={item.title}
              className="group rounded-3xl border border-white/10 bg-white/[0.055] p-6 backdrop-blur transition hover:-translate-y-2 hover:border-blue-300/40 hover:bg-white/[0.08]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-300 shadow-lg shadow-blue-500/20 transition group-hover:rotate-6 group-hover:scale-110">
                <Image
                  src="/modelhawk-icon.png"
                  alt=""
                  width={34}
                  height={34}
                  className="h-8 w-8 object-contain"
                />
              </div>

              <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-blue-300">
                {item.label}
              </p>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="pipeline"
        className="relative z-10 mx-auto max-w-7xl px-6 py-20"
      >
        <div className="rounded-[2rem] border border-white/10 bg-[#050B18]/80 p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
                How it is different
              </p>
              <h2 className="text-4xl font-black tracking-tight md:text-5xl">
                The AI is not the product. The audit workflow is.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                A generic AI can comment on code. ModelHawk is designed to
                inspect machine learning projects using a repeatable audit
                pipeline: extraction, checks, scoring and explanation.
              </p>
            </div>

            <div className="grid gap-3">
              {pipeline.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-sm font-black text-blue-300">
                    {index + 1}
                  </div>
                  <p className="font-semibold text-slate-100">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-blue-300">
            ModelHawk vs generic AI
          </p>
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">
            Built for ML project defense.
          </h2>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] backdrop-blur">
          <div className="grid grid-cols-2 border-b border-white/10 bg-white/[0.04] text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            <div className="p-5">Generic AI</div>
            <div className="border-l border-white/10 p-5 text-blue-300">
              ModelHawk
            </div>
          </div>

          {comparisons.map((item) => (
            <div
              key={item.generic}
              className="grid grid-cols-2 border-b border-white/10 last:border-b-0"
            >
              <div className="p-5 text-sm leading-6 text-slate-400">
                {item.generic}
              </div>
              <div className="border-l border-white/10 p-5 text-sm leading-6 text-slate-200">
                {item.modelhawk}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-3xl border border-white/10 bg-[#050B18]/80 p-7 transition hover:-translate-y-2 hover:border-blue-300/40"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-xl font-black text-blue-300">
                {index + 1}
              </div>
              <h3 className="text-xl font-bold">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="demo"
        className="relative z-10 mx-auto max-w-7xl px-6 py-20"
      >
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-blue-500/[0.08] p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
                Interactive upload
              </p>
              <h2 className="text-4xl font-black">
                Drop a notebook. Get a defense plan.
              </h2>
              <p className="mt-5 text-slate-300">
                The first version runs a static audit: code patterns,
                evaluation choices, reproducibility signals and report-quality
                feedback. Later, ModelHawk can add real stress-tests like
                repeated splits and target permutation checks.
              </p>
            </div>

            <div className="rounded-3xl border border-dashed border-blue-300/40 bg-[#020817]/70 p-8 text-center transition hover:border-cyan-300/70 hover:bg-blue-500/10">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 text-3xl">
                ↑
              </div>
              <p className="text-lg font-bold">Upload .ipynb</p>
              <p className="mt-2 text-sm text-slate-400">
                Start with the prototype upload page
              </p>
              <a
                href="/upload"
                className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-bold text-[#020817] transition hover:scale-105"
              >
                Open upload page
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="waitlist"
        className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center"
      >
        <div className="mb-8 flex justify-center">
          <div className="rounded-3xl bg-white p-3 shadow-2xl shadow-blue-500/20">
            <Image
              src="/modelhawk-full-logo.png"
              alt="ModelHawk full logo"
              width={220}
              height={220}
              className="h-auto w-40 object-contain md:w-52"
            />
          </div>
        </div>

        <h2 className="text-4xl font-black md:text-5xl">
          Build projects that survive scrutiny.
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-slate-300">
          Join the early access list for students, Kaggle beginners, bootcamp
          students and junior ML/data applicants.
        </p>

        <div className="mx-auto mt-8 flex max-w-xl flex-col gap-3 rounded-[2rem] border border-white/10 bg-white/[0.06] p-2 sm:flex-row sm:rounded-full">
          <input
            placeholder="Enter your email"
            className="flex-1 bg-transparent px-5 py-3 text-white outline-none placeholder:text-slate-500"
          />
          <button className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-7 py-3 font-bold text-[#020817] transition hover:scale-105">
            Join waitlist
          </button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-6 py-8 text-center text-sm text-slate-500">
        ModelHawk — The adversarial examiner for ML projects.
      </footer>
    </main>
  );
}

function AuditRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold text-white">{value}%</span>
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