import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

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

type AiVivaAnswer = {
  question: string;
  answer?: string;
  suggestedAnswer?: string;
};

type AiNarrative = {
  executiveSummary?: string;
  technicalAssessment?: string;
  riskInterpretation?: string;
  portfolioVerdict?: string;
  improvedRecommendations?: string[];
  suggestedMarkdownCells?: SuggestedMarkdownCell[];
  vivaAnswers?: AiVivaAnswer[];
  limitations?: string[];
};

type PdfRequestBody =
  | AuditResult
  | {
      auditResult: AuditResult;
      aiNarrative?: AiNarrative | null;
    }
  | {
      result: AuditResult;
      aiNarrative?: AiNarrative | null;
    };

type PdfAssets = {
  logoFile: string | null;
  reportIconFile: string | null;
};

export async function POST(request: Request) {
  let workDir = "";

  try {
    const rawBody = (await request.json()) as PdfRequestBody;
    const { result, aiNarrative } = normalisePdfRequest(rawBody);

    if (!result?.fileName) {
      return NextResponse.json(
        {
          error:
            "Invalid PDF request. Expected an audit result with a fileName.",
        },
        { status: 400 }
      );
    }

    workDir = await fs.mkdtemp(path.join(os.tmpdir(), "modelhawk-"));

    const logoFile = await copyFirstExistingAsset([
      {
        source: path.join(process.cwd(), "public", "logo.png"),
        destination: path.join(workDir, "logo.png"),
      },
      {
        source: path.join(process.cwd(), "public", "modelhawk-full-logo.png"),
        destination: path.join(workDir, "logo.png"),
      },
      {
        source: path.join(process.cwd(), "public", "modelhawk-wordmark.png"),
        destination: path.join(workDir, "logo.png"),
      },
      {
        source: path.join(process.cwd(), "public", "modelhawk-icon.png"),
        destination: path.join(workDir, "logo.png"),
      },
    ]);

    const reportIconFile = await copyFirstExistingAsset([
      {
        source: path.join(process.cwd(), "public", "report-icon.jpg"),
        destination: path.join(workDir, "report-icon.jpg"),
      },
      {
        source: path.join(process.cwd(), "public", "report-icon.jpeg"),
        destination: path.join(workDir, "report-icon.jpg"),
      },
      {
        source: path.join(process.cwd(), "public", "report-icon.png"),
        destination: path.join(workDir, "report-icon.png"),
      },
    ]);

    const tex = buildLatexReport(result, aiNarrative, {
      logoFile,
      reportIconFile,
    });

    const texPath = path.join(workDir, "report.tex");
    const pdfPath = path.join(workDir, "report.pdf");

    await fs.writeFile(texPath, tex, "utf-8");

    await runCommand(
      "pdflatex",
      ["-interaction=nonstopmode", "-halt-on-error", "report.tex"],
      workDir
    );

    await runCommand(
      "pdflatex",
      ["-interaction=nonstopmode", "-halt-on-error", "report.tex"],
      workDir
    );

    const pdfBuffer = await fs.readFile(pdfPath);

    const safeName = result.fileName
      .replace(/\.ipynb$/i, "")
      .replace(/[^a-z0-9-_]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="modelhawk-audit-${
          safeName || "notebook"
        }.pdf"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown PDF generation error.";

    console.error("MODELHAWK PDF ERROR:");
    console.error(message);

    return NextResponse.json(
      {
        error: message.slice(0, 3000),
      },
      { status: 500 }
    );
  } finally {
    if (workDir) {
      await fs.rm(workDir, { recursive: true, force: true });
    }
  }
}

function normalisePdfRequest(body: PdfRequestBody): {
  result: AuditResult;
  aiNarrative: AiNarrative | null;
} {
  const maybeWrapped = body as {
    auditResult?: AuditResult;
    result?: AuditResult;
    aiNarrative?: AiNarrative | null;
  };

  if (maybeWrapped.auditResult) {
    return {
      result: maybeWrapped.auditResult,
      aiNarrative: maybeWrapped.aiNarrative ?? null,
    };
  }

  if (maybeWrapped.result) {
    return {
      result: maybeWrapped.result,
      aiNarrative: maybeWrapped.aiNarrative ?? null,
    };
  }

  return {
    result: body as AuditResult,
    aiNarrative: null,
  };
}

async function copyFirstExistingAsset(
  candidates: { source: string; destination: string }[]
) {
  for (const candidate of candidates) {
    try {
      await fs.access(candidate.source);
      await fs.copyFile(candidate.source, candidate.destination);
      return path.basename(candidate.destination);
    } catch {
      // Try next asset.
    }
  }

  return null;
}

function runCommand(command: string, args: string[], cwd: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `pdflatex failed with code ${code}\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`
          )
        );
      }
    });
  });
}

function buildLatexReport(
  result: AuditResult,
  aiNarrative: AiNarrative | null,
  assets: PdfAssets
) {
  const overallVerdict = getOverallVerdict(result);

  const projectProfile = renderProjectProfile(result);
  const findings = renderFindings(result.findings);
  const goodPractices = renderBulletList(
    result.goodPractices,
    "No specific good-practice signals were returned by the current audit."
  );
  const risksToVerify = renderBulletList(
    result.risksToVerify,
    "No additional risks to verify were returned by the current audit."
  );
  const priorityFixes = renderBulletList(
    result.priorityFixes,
    "No urgent priority fixes were returned by the current audit."
  );
  const recommendations = renderNumberedList(
    result.recommendations,
    "No extra recommendations were returned by the current audit."
  );
  const suggestedMarkdownCells = renderSuggestedMarkdownCells(
    result.suggestedMarkdownCells,
    "No suggested markdown cells were returned by the current audit."
  );

  const aiSection = renderAiNarrative(aiNarrative);

  const signals = Object.entries(result.signals || {})
    .filter(([, value]) => value === true)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([signal]) => `\\item ${latexEscape(formatSignal(signal))}`)
    .join("\n");

  const questions =
    safeArray(result.vivaQuestions).length > 0
      ? safeArray(result.vivaQuestions)
          .map((question) => `\\item ${latexEscape(question)}`)
          .join("\n")
      : "\\item No viva questions were generated.";

  const logoBlock = assets.logoFile
    ? `\\includegraphics[width=0.52\\textwidth]{${assets.logoFile}}`
    : `{\\Huge\\bfseries Model\\textcolor{mainblue}{Hawk}\\par}`;

  const reportIconBlock = assets.reportIconFile
    ? `\\includegraphics[width=0.21\\textwidth]{${assets.reportIconFile}}`
    : `\\fcolorbox{mainblue}{softblue}{
        \\begin{minipage}{0.34\\textwidth}
        \\centering
        \\vspace{0.45cm}
        {\\Large\\bfseries ML Audit}\\\\[0.2cm]
        {\\small Technical report generated from notebook evidence}
        \\vspace{0.45cm}
        \\end{minipage}
      }`;

  return `\\documentclass[a4paper,11pt,titlepage]{article}

% --------------------------------------------------
% Page layout
% --------------------------------------------------
\\usepackage[
  includehead,
  includefoot,
  headheight=14pt,
  headsep=18pt,
  left=2cm,
  right=2cm,
  top=2cm,
  bottom=2cm
]{geometry}

% --------------------------------------------------
% Encoding, language and professional typography
% --------------------------------------------------
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[english]{babel}

% Professional report typography
\\usepackage{newtxtext}
\\usepackage{newtxmath}
\\usepackage{microtype}

\\frenchspacing
\\AtBeginDocument{\\selectlanguage{english}}
\\AtBeginDocument{\\renewcommand{\\tablename}{Table}}

% --------------------------------------------------
% Core packages
% --------------------------------------------------
\\usepackage{graphicx}
\\usepackage{float}
\\usepackage{array}
\\usepackage{longtable}
\\usepackage{tabularx}
\\usepackage[table,xcdraw]{xcolor}
\\usepackage{enumitem}
\\usepackage{caption}
\\usepackage{fancyhdr}
\\usepackage{titlesec}
\\usepackage[colorlinks=true,linkcolor=black,urlcolor=blue]{hyperref}

% --------------------------------------------------
% Custom colours
% --------------------------------------------------
\\definecolor{mainblue}{RGB}{32,84,165}
\\definecolor{softblue}{RGB}{232,240,252}
\\definecolor{softgreen}{RGB}{232,245,236}
\\definecolor{maingreen}{RGB}{42,120,82}
\\definecolor{softyellow}{RGB}{255,248,222}
\\definecolor{mainyellow}{RGB}{170,130,20}
\\definecolor{softred}{RGB}{252,235,235}
\\definecolor{mainred}{RGB}{160,60,60}
\\definecolor{softpurple}{RGB}{240,235,252}
\\definecolor{mainpurple}{RGB}{110,70,160}
\\definecolor{lightgray}{RGB}{248,250,252}
\\definecolor{midgray}{RGB}{100,116,139}
\\definecolor{darknavy}{RGB}{2,8,23}
\\definecolor{rulegray}{RGB}{203,213,225}

% --------------------------------------------------
% Section styling
% --------------------------------------------------
\\titleformat{\\section}
  {\\Large\\bfseries\\color{darknavy}}
  {}
  {0pt}
  {}

\\titlespacing*{\\section}
  {0pt}
  {0.82cm}
  {0.28cm}

% --------------------------------------------------
% Formatting
% --------------------------------------------------
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.42em}
\\renewcommand{\\arraystretch}{1.22}

\\setlist[itemize]{
  topsep=0.12cm,
  itemsep=0.055cm,
  leftmargin=0.62cm,
  label=\\textbullet
}

\\setlist[enumerate]{
  topsep=0.12cm,
  itemsep=0.07cm,
  leftmargin=0.72cm
}

\\emergencystretch=2em
\\sloppy

% --------------------------------------------------
% Caption formatting
% --------------------------------------------------
\\DeclareCaptionFont{ninept}{\\fontsize{9pt}{11pt}\\selectfont}
\\captionsetup{
  font=ninept,
  labelfont={bf,ninept}
}
\\renewcommand{\\tablename}{Table}
\\renewcommand{\\listtablename}{List of Tables}
\\captionsetup[table]{name=Table}

% --------------------------------------------------
% Header and footer
% --------------------------------------------------
\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0.4pt}
\\renewcommand{\\footrulewidth}{0.2pt}
\\renewcommand{\\headrule}{\\hbox to\\headwidth{\\color{rulegray}\\leaders\\hrule height \\headrulewidth\\hfill}}
\\renewcommand{\\footrule}{\\hbox to\\headwidth{\\color{rulegray}\\leaders\\hrule height \\footrulewidth\\hfill}}

\\fancyhead[L]{\\small\\color{darknavy} ModelHawk}
\\fancyhead[R]{\\small\\color{midgray} Static ML Project Audit}
\\fancyfoot[L]{\\small\\color{midgray} Generated report}
\\fancyfoot[R]{\\small\\color{midgray} Page \\thepage}

\\fancypagestyle{plain}{
  \\fancyhf{}
  \\renewcommand{\\headrulewidth}{0pt}
  \\renewcommand{\\footrulewidth}{0pt}
}

\\begin{document}

% ==================================================
% Title page
% ==================================================
\\begin{titlepage}
\\thispagestyle{plain}
\\centering

\\vspace*{-0.35cm}

\\begin{figure}[H]
    \\centering
    ${logoBlock}
\\end{figure}

\\vspace{0.15cm}
\\noindent{\\color{rulegray}\\rule{\\textwidth}{0.6pt}}

\\vspace{0.34cm}

{\\huge\\bfseries\\color{darknavy} Static ML Project Audit Report\\par}

\\vspace{0.18cm}

{\\Large\\color{midgray} Adversarial examiner for machine learning notebooks\\par}

\\vspace{0.34cm}
\\noindent{\\color{rulegray}\\rule{\\textwidth}{0.6pt}}

\\vspace{0.85cm}

\\begin{figure}[H]
    \\centering
    ${reportIconBlock}
\\end{figure}

\\vfill

\\noindent\\fcolorbox{mainblue}{lightgray}{
\\begin{minipage}{0.92\\textwidth}
\\textbf{File analysed:} ${latexEscape(result.fileName)}\\\\
\\textbf{Audit type:} Static notebook analysis with optional local AI examiner notes\\\\
\\textbf{Generated by:} ModelHawk
\\end{minipage}
}

\\end{titlepage}

\\setcounter{page}{1}

% ==================================================
% Executive summary
% ==================================================
\\section*{Executive Summary}

\\noindent\\fcolorbox{mainblue}{softblue}{
\\begin{minipage}{0.95\\textwidth}
${latexEscape(overallVerdict)}
\\end{minipage}
}

\\vspace{0.2cm}

\\noindent\\fcolorbox{mainyellow}{softyellow}{
\\begin{minipage}{0.95\\textwidth}
\\textbf{Important limitation.} This report is based on static notebook analysis. It does not execute the notebook and does not prove the absence of data leakage, methodological issues or implementation errors. Instead, it highlights technical signals, likely risks and improvement opportunities detected from the notebook structure, code and markdown.
\\end{minipage}
}

% ==================================================
% Methodology
% ==================================================
\\section*{Report Scope and Methodology}

\\begin{table}[H]
\\centering
\\begin{tabular}{|p{0.32\\textwidth}|p{0.56\\textwidth}|}
\\hline
\\rowcolor{softblue}
\\textbf{Component} & \\textbf{Description} \\\\
\\hline
Notebook parser & Reads code cells, markdown cells and notebook-level structure from the uploaded .ipynb file. \\\\
\\hline
Static audit rules & Detects ML workflow signals such as splitting, metrics, reproducibility, resampling, pipelines, limitations and business context. \\\\
\\hline
Heuristic scores & Converts detected signals into review dimensions for leakage risk, metric quality, reproducibility and portfolio readiness. \\\\
\\hline
Local AI examiner & Optionally converts the deterministic audit result into clearer technical review notes using a local Ollama model. \\\\
\\hline
PDF report & Compiles the structured audit into a professional LaTeX report suitable for portfolio review and technical discussion. \\\\
\\hline
\\end{tabular}
\\caption{ModelHawk report generation pipeline.}
\\end{table}

% ==================================================
% Detected project profile
% ==================================================
\\section*{Detected Project Profile}

${projectProfile}

% ==================================================
% Notebook profile
% ==================================================
\\section*{Notebook Structure}

\\begin{table}[H]
\\centering
\\begin{tabular}{|p{0.55\\textwidth}|p{0.25\\textwidth}|}
\\hline
\\rowcolor{softblue}
\\textbf{Metric} & \\textbf{Value} \\\\
\\hline
Total cells & ${countValue(result.summary?.totalCells)} \\\\
\\hline
Code cells & ${countValue(result.summary?.codeCells)} \\\\
\\hline
Markdown cells & ${countValue(result.summary?.markdownCells)} \\\\
\\hline
\\end{tabular}
\\caption{Notebook structure summary.}
\\end{table}

% ==================================================
% Audit scores
% ==================================================
\\section*{Audit Scores}

\\begin{table}[H]
\\centering
\\begin{tabular}{|p{0.32\\textwidth}|p{0.17\\textwidth}|p{0.37\\textwidth}|}
\\hline
\\rowcolor{softblue}
\\textbf{Dimension} & \\textbf{Score} & \\textbf{Interpretation} \\\\
\\hline
Leakage risk & ${scoreValue(result.scores?.leakageRisk)}/100 & Lower is better. This reflects static warning signals. \\\\
\\hline
Metric quality & ${scoreValue(result.scores?.metricQuality)}/100 & Higher suggests stronger metric coverage. \\\\
\\hline
Reproducibility & ${scoreValue(result.scores?.reproducibility)}/100 & Higher suggests better reproducibility signals. \\\\
\\hline
Portfolio readiness & ${scoreValue(result.scores?.portfolioReadiness)}/100 & Higher suggests stronger presentation and documentation. \\\\
\\hline
\\end{tabular}
\\caption{ModelHawk static audit scores.}
\\end{table}

\\noindent\\fcolorbox{maingreen}{softgreen}{
\\begin{minipage}{0.95\\textwidth}
\\textbf{Score interpretation.} Scores are heuristic static-analysis scores based on detected notebook signals. They are not statistical probabilities and do not guarantee correctness.
\\end{minipage}
}

% ==================================================
% Main findings
% ==================================================
\\section*{Audit Findings}

${findings}

% ==================================================
% Good practices
% ==================================================
\\section*{Good Practices Detected}

\\noindent\\fcolorbox{maingreen}{softgreen}{
\\begin{minipage}{0.95\\textwidth}
The following positive signals were detected in the notebook. These do not prove correctness, but they indicate stronger ML project structure and documentation.
\\end{minipage}
}

${goodPractices}

% ==================================================
% Risks to verify
% ==================================================
\\section*{Risks to Verify}

\\noindent\\fcolorbox{mainyellow}{softyellow}{
\\begin{minipage}{0.95\\textwidth}
These are not necessarily errors. They are review points that should be checked carefully before submission, publication or technical discussion.
\\end{minipage}
}

${risksToVerify}

% ==================================================
% Priority fixes
% ==================================================
\\section*{Priority Fixes}

${priorityFixes}

% ==================================================
% Recommendations
% ==================================================
\\section*{Recommendations}

${recommendations}

% ==================================================
% Suggested markdown cells
% ==================================================
\\section*{Suggested Notebook Improvements}

\\noindent\\fcolorbox{mainblue}{softblue}{
\\begin{minipage}{0.95\\textwidth}
The following markdown suggestions are designed to improve the explanation and defensibility of the notebook.
\\end{minipage}
}

${suggestedMarkdownCells}

${aiSection}

% ==================================================
% Viva and interview preparation
% ==================================================
\\section*{Viva and Interview Preparation}

\\noindent\\fcolorbox{mainpurple}{softpurple}{
\\begin{minipage}{0.95\\textwidth}
These questions are designed to help the author defend modelling choices, evaluation strategy and project limitations in a technical discussion.
\\end{minipage}
}

\\begin{enumerate}[leftmargin=*]
${questions}
\\end{enumerate}

% ==================================================
% Detected technical signals
% ==================================================
\\section*{Detected Technical Signals}

\\noindent\\fcolorbox{mainblue}{softblue}{
\\begin{minipage}{0.95\\textwidth}
The following static signals were detected from the notebook code and markdown.
\\end{minipage}
}

\\begin{itemize}[leftmargin=*]
${signals || "\\item No positive signals detected."}
\\end{itemize}

% ==================================================
% Final note
% ==================================================
\\section*{Final Note}

\\noindent\\fcolorbox{mainblue}{lightgray}{
\\begin{minipage}{0.95\\textwidth}
Generated by ModelHawk. This automatically generated report should be interpreted as technical guidance, not as a final guarantee of correctness. A complete review would require executing the notebook, validating the data pipeline, checking runtime outputs and reviewing the modelling decisions in context.
\\end{minipage}
}

\\end{document}
`;
}

function renderAiNarrative(aiNarrative: AiNarrative | null) {
  if (!aiNarrative) {
    return `
% ==================================================
% Local AI examiner notes
% ==================================================
\\section*{Local AI Examiner Notes}

\\noindent\\fcolorbox{mainyellow}{softyellow}{
\\begin{minipage}{0.95\\textwidth}
No local AI examiner narrative was included in this PDF request. The deterministic static audit sections above were still generated successfully.
\\end{minipage}
}
`;
  }

  const executiveSummary = renderAiTextBox(
    "Executive summary",
    aiNarrative.executiveSummary,
    "No AI executive summary was included."
  );

  const technicalAssessment = renderAiTextBox(
    "Technical assessment",
    aiNarrative.technicalAssessment,
    "No AI technical assessment was included."
  );

  const riskInterpretation = renderAiTextBox(
    "Risk interpretation",
    aiNarrative.riskInterpretation,
    "No AI risk interpretation was included."
  );

  const portfolioVerdict = renderAiTextBox(
    "Portfolio verdict",
    aiNarrative.portfolioVerdict,
    "No AI portfolio verdict was included."
  );

  const improvedRecommendations = renderNumberedList(
    aiNarrative.improvedRecommendations,
    "No AI-improved recommendations were included."
  );

  const aiSuggestedMarkdownCells = renderSuggestedMarkdownCells(
    aiNarrative.suggestedMarkdownCells,
    "No AI-suggested markdown cells were included."
  );

  const vivaAnswers = renderAiVivaAnswers(aiNarrative.vivaAnswers);

  const limitations = renderBulletList(
    aiNarrative.limitations,
    "No AI limitations were included."
  );

  return `
% ==================================================
% Local AI examiner notes
% ==================================================
\\section*{Local AI Examiner Notes}

\\noindent\\fcolorbox{mainpurple}{softpurple}{
\\begin{minipage}{0.95\\textwidth}
\\textbf{Local AI technical review.} These notes were generated by a local Ollama model using the deterministic ModelHawk audit as evidence. They should be treated as explanatory support, not as proof that the notebook is correct.
\\end{minipage}
}

${executiveSummary}

${technicalAssessment}

${riskInterpretation}

${portfolioVerdict}

\\subsection*{AI-Improved Recommendations}

${improvedRecommendations}

\\subsection*{AI-Suggested Markdown Cells}

${aiSuggestedMarkdownCells}

\\subsection*{AI-Assisted Viva Answer Guidance}

${vivaAnswers}

\\subsection*{AI Layer Limitations}

${limitations}
`;
}

function renderAiTextBox(title: string, text: string | undefined, fallback: string) {
  return `
\\vspace{0.15cm}

\\noindent\\fcolorbox{mainpurple}{lightgray}{
\\begin{minipage}{0.95\\textwidth}
\\textbf{${latexEscape(title)}}\\\\[0.12cm]
${latexEscape(text && text.trim().length > 0 ? text : fallback)}
\\end{minipage}
}

\\vspace{0.18cm}
`;
}

function renderAiVivaAnswers(answers: AiVivaAnswer[] | undefined) {
  const safeAnswers = safeArray(answers).filter((answer) => {
    const answerText = getAiVivaAnswerText(answer);

    return (
      (answer.question && answer.question.trim().length > 0) ||
      answerText.trim().length > 0
    );
  });

  if (safeAnswers.length === 0) {
    return `\\noindent\\fcolorbox{mainyellow}{softyellow}{
\\begin{minipage}{0.95\\textwidth}
No AI-assisted viva answers were included.
\\end{minipage}
}`;
  }

  return safeAnswers
    .map((answer, index) => {
      const answerText = getAiVivaAnswerText(answer);

      return `
\\noindent\\fcolorbox{mainpurple}{lightgray}{
\\begin{minipage}{0.95\\textwidth}
\\textbf{Q${index + 1}. ${latexEscape(
        answer.question || "Question not available."
      )}}\\\\[0.14cm]
${latexEscape(answerText || "Answer guidance not available.")}
\\end{minipage}
}

\\vspace{0.22cm}
`;
    })
    .join("\n");
}

function getAiVivaAnswerText(answer: AiVivaAnswer) {
  return String(answer.answer || answer.suggestedAnswer || "").trim();
}

function renderProjectProfile(result: AuditResult) {
  const profile = result.projectProfile;

  if (!profile) {
    return `\\noindent\\fcolorbox{mainyellow}{softyellow}{
\\begin{minipage}{0.95\\textwidth}
No project profile was returned by the current audit engine.
\\end{minipage}
}`;
  }

  const secondaryTasks =
    profile.secondaryTasks && profile.secondaryTasks.length > 0
      ? profile.secondaryTasks.map(prettyLabel).join(", ")
      : "None detected";

  const traits =
    profile.problemTraits && profile.problemTraits.length > 0
      ? profile.problemTraits.map(prettyLabel).join(", ")
      : "None detected";

  const packs =
    profile.appliedPacks && profile.appliedPacks.length > 0
      ? profile.appliedPacks.map(prettyLabel).join(", ")
      : "None detected";

  return `
\\begin{table}[H]
\\centering
\\begin{tabular}{|p{0.33\\textwidth}|p{0.55\\textwidth}|}
\\hline
\\rowcolor{softblue}
\\textbf{Field} & \\textbf{Detected value} \\\\
\\hline
Primary task & ${latexEscape(prettyLabel(profile.primaryTask))} \\\\
\\hline
Secondary tasks & ${latexEscape(secondaryTasks)} \\\\
\\hline
Data modality & ${latexEscape(prettyLabel(profile.dataModality))} \\\\
\\hline
Problem traits & ${latexEscape(traits)} \\\\
\\hline
Applied audit packs & ${latexEscape(packs)} \\\\
\\hline
Confidence & ${latexEscape(profile.confidenceLabel)} - ${scoreValue(
    profile.confidence
  )}/100 \\\\
\\hline
\\end{tabular}
\\caption{Detected project profile and applied audit packs.}
\\end{table}
`;
}

function renderFindings(findings: Finding[]) {
  const safeFindings = safeArray(findings);

  if (safeFindings.length === 0) {
    return `\\noindent\\fcolorbox{maingreen}{softgreen}{
\\begin{minipage}{0.95\\textwidth}
No major static red flags were detected by the current audit engine.
\\end{minipage}
}`;
  }

  return safeFindings
    .map((finding) => {
      const colour = findingColour(finding);

      return `
\\noindent\\fcolorbox{${colour.border}}{${colour.background}}{
\\begin{minipage}{0.95\\textwidth}
\\textbf{${latexEscape(finding.title)}}\\\\[0.12cm]
\\textbf{Severity:} ${latexEscape(finding.severity)}\\\\[0.12cm]
${latexEscape(finding.text)}
\\end{minipage}
}

\\vspace{0.25cm}
`;
    })
    .join("\n");
}

function findingColour(finding: Finding) {
  const title = String(finding.title || "").toLowerCase();
  const severity = String(finding.severity || "").toLowerCase();

  if (title.includes("no major static red flags")) {
    return {
      border: "maingreen",
      background: "softgreen",
    };
  }

  if (severity === "high") {
    return {
      border: "mainred",
      background: "softred",
    };
  }

  if (severity === "medium") {
    return {
      border: "mainyellow",
      background: "softyellow",
    };
  }

  if (severity === "low") {
    return {
      border: "maingreen",
      background: "softgreen",
    };
  }

  return {
    border: "mainblue",
    background: "softblue",
  };
}

function renderBulletList(items: string[] | undefined, emptyText: string) {
  const safeItems = items && items.length > 0 ? items : [emptyText];

  return `\\begin{itemize}
${safeItems.map((item) => `\\item ${latexEscape(item)}`).join("\n")}
\\end{itemize}`;
}

function renderNumberedList(items: string[] | undefined, emptyText: string) {
  const safeItems = items && items.length > 0 ? items : [emptyText];

  return `\\begin{enumerate}
${safeItems.map((item) => `\\item ${latexEscape(item)}`).join("\n")}
\\end{enumerate}`;
}

function renderSuggestedMarkdownCells(
  cells: SuggestedMarkdownCell[] | undefined,
  emptyText: string
) {
  const safeCells = safeArray(cells).filter(
    (cell) =>
      (cell.title && cell.title.trim().length > 0) ||
      (cell.where && cell.where.trim().length > 0) ||
      (cell.text && cell.text.trim().length > 0)
  );

  if (safeCells.length === 0) {
    return `\\noindent\\fcolorbox{mainyellow}{softyellow}{
\\begin{minipage}{0.95\\textwidth}
${latexEscape(emptyText)}
\\end{minipage}
}`;
  }

  return safeCells
    .map(
      (cell) => `
\\noindent\\fcolorbox{mainblue}{lightgray}{
\\begin{minipage}{0.95\\textwidth}
\\textbf{${latexEscape(cell.title || "Suggested markdown cell")}}\\\\[0.12cm]
\\textbf{Where:} ${latexEscape(cell.where || "Recommended location not specified.")}\\\\[0.2cm]
${latexEscape(cell.text || "Suggested markdown text not available.")}
\\end{minipage}
}

\\vspace{0.25cm}
`
    )
    .join("\n");
}

function getOverallVerdict(result: AuditResult) {
  const leakage = scoreValue(result.scores?.leakageRisk);
  const metric = scoreValue(result.scores?.metricQuality);
  const reproducibility = scoreValue(result.scores?.reproducibility);
  const portfolio = scoreValue(result.scores?.portfolioReadiness);

  const findings = safeArray(result.findings);

  const hasHighFinding = findings.some(
    (finding) => String(finding.severity || "").toLowerCase() === "high"
  );

  const hasNoMajorRedFlags = findings.some((finding) =>
    String(finding.title || "")
      .toLowerCase()
      .includes("no major static red flags")
  );

  const profile = result.projectProfile
    ? ` The detected project profile is ${prettyLabel(
        result.projectProfile.primaryTask
      )} with ${prettyLabel(result.projectProfile.dataModality)} data.`
    : "";

  if (
    !hasHighFinding &&
    (hasNoMajorRedFlags || findings.length === 0) &&
    leakage <= 25 &&
    metric >= 80 &&
    reproducibility >= 75 &&
    portfolio >= 75
  ) {
    return `The notebook shows strong static audit signals.${profile} ModelHawk detected positive evidence for evaluation quality, reproducibility and portfolio readiness. No major static red flags were detected, although the workflow should still be reviewed because static analysis cannot prove methodological correctness.`;
  }

  if (leakage >= 60 || metric < 50 || reproducibility < 50 || hasHighFinding) {
    return `The notebook presents several areas that may require technical improvement before submission, publication or interview discussion.${profile} The main priorities are to review leakage risk, strengthen evaluation choices and improve reproducibility evidence.`;
  }

  return `The notebook appears to have a moderate technical profile.${profile} ModelHawk detected useful strengths, but also identified areas where the modelling workflow, metric justification or project documentation could be improved.`;
}

function scoreValue(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function countValue(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.max(0, Math.round(numberValue));
}

function safeArray<T>(items: T[] | undefined | null): T[] {
  return Array.isArray(items) ? items : [];
}

function normaliseLatexText(value: string) {
  return String(value ?? "")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("−", "-")
    .replaceAll("’", "'")
    .replaceAll("‘", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("…", "...")
    .replaceAll("→", "->")
    .replaceAll("←", "<-")
    .replaceAll("≤", "<=")
    .replaceAll("≥", ">=")
    .replaceAll("×", "x")
    .replaceAll("·", "-")
    .replaceAll("•", "-")
    .replaceAll("✓", "check")
    .replaceAll("✔", "check")
    .replaceAll("✗", "x")
    .replaceAll("✕", "x")
    .replace(/\uFFFE/g, "");
}

function latexEscape(value: string) {
  return normaliseLatexText(value).replace(/[\\&%$#_{}~^]/g, (char) => {
    switch (char) {
      case "\\":
        return "\\textbackslash{}";
      case "&":
        return "\\&";
      case "%":
        return "\\%";
      case "$":
        return "\\$";
      case "#":
        return "\\#";
      case "_":
        return "\\_";
      case "{":
        return "\\{";
      case "}":
        return "\\}";
      case "~":
        return "\\textasciitilde{}";
      case "^":
        return "\\textasciicircum{}";
      default:
        return char;
    }
  });
}

function formatSignal(signal: string) {
  return String(signal || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

function prettyLabel(value: string) {
  return String(value || "unknown")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}