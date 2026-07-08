<p align="center">
  <img src="public/logo.png" alt="ModelHawk logo" width="280" />
</p>

<h1 align="center">ModelHawk</h1>

<p align="center">
  <strong>Static ML notebook auditing with local AI examiner notes and professional PDF reports.</strong>
</p>

<p align="center">
  <a href="https://github.com/albertoreyescastro/modelhawk">
    <img src="https://img.shields.io/badge/status-prototype-blue" alt="Project status" />
  </a>
  <img src="https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Ollama-local%20AI-222222" alt="Ollama local AI" />
  <img src="https://img.shields.io/badge/LaTeX-PDF%20reports-008080" alt="LaTeX PDF reports" />
</p>

---

## Overview

**ModelHawk** is a personal AI/ML technical prototype that analyses Jupyter notebooks through static audit rules, detects machine-learning workflow signals, highlights likely risks, generates local AI-assisted examiner notes, and exports a professional PDF audit report.

The project combines:

- **Next.js** and **TypeScript** for the web application
- **Static notebook analysis** for deterministic ML workflow checks
- **Ollama** for local AI examiner notes
- **LaTeX / pdflatex** for professional PDF report generation
- **Portfolio-oriented ML review logic** for technical documentation and interview preparation

ModelHawk is currently a prototype and should be interpreted as technical guidance, not as a guarantee of notebook correctness.

---

## Live prototype demo

A temporary live prototype is available here:

[Open ModelHawk live demo](https://website-respondents-jaguar-opened.trycloudflare.com)

> **Demo availability note**  
> This prototype is currently exposed through a temporary Cloudflare Tunnel from my local development machine.  
> The link only works while my local terminal, Next.js server, Ollama service and tunnel are running.  
> If the link is offline, the code can still be reviewed and run locally using the instructions below.

---

## Screenshots

### Landing page

![ModelHawk landing page](docs/screenshots/01-landing-page.png)

### Notebook upload page

![ModelHawk upload page](docs/screenshots/02-upload-page.png)

### Static audit results

![ModelHawk audit results](docs/screenshots/03-audit-results.png)

### Local AI examiner notes

![ModelHawk AI examiner notes](docs/screenshots/04-ai-examiner-notes.png)

### Generated PDF report

![ModelHawk PDF report](docs/screenshots/05-pdf-report.png)

---

## Demo notebook

You can test ModelHawk using the sample fraud detection notebook included in this repository:

[Download demo notebook: credit_card_fraud_detection.ipynb](./examples/credit_card_fraud_detection.ipynb)

Recommended test flow:

1. Open the live prototype or run the project locally.
2. Go to the **Upload Notebook** page.
3. Upload `examples/credit_card_fraud_detection.ipynb`.
4. Run the static audit.
5. Review the detected project profile, scores, findings, risks, recommendations and AI examiner notes.
6. Download the generated PDF report.

The demo notebook is a machine-learning project focused on:

- credit card fraud detection
- imbalanced classification
- preprocessing
- model comparison
- threshold selection
- precision/recall evaluation
- PR-AUC and ROC-AUC style model assessment

---

## Sample PDF report

A sample generated audit report can be included here:

[Open sample ModelHawk PDF report](./docs/reports/modelhawk-sample-audit-report.pdf)

The PDF report is generated locally through the ModelHawk PDF route using LaTeX.

---

## What ModelHawk does

ModelHawk performs a static analysis of uploaded `.ipynb` notebooks. It does not execute notebook code. Instead, it parses notebook content and searches for technical signals related to machine-learning project quality.

Current capabilities include:

- detecting the likely ML project profile
- identifying the primary task, such as classification
- detecting data modality, such as tabular data
- recognising problem traits such as class imbalance, fraud detection, threshold-sensitive evaluation or deep learning signals
- detecting ML workflow signals such as:
  - train/test split
  - stratified split
  - cross-validation
  - random seeds
  - pipelines or `ColumnTransformer`
  - SMOTE or resampling
  - baseline models
  - hyperparameter search
  - PR-AUC, ROC-AUC, precision, recall and F1 evaluation
  - threshold tuning
  - markdown explanation and limitations sections
- producing heuristic audit scores
- highlighting good practices
- highlighting risks to verify
- suggesting priority fixes and notebook improvements
- generating viva/interview preparation questions
- generating local AI examiner notes with Ollama
- exporting a professional PDF audit report compiled with LaTeX

---

## Example output

When tested with the included credit card fraud detection notebook, ModelHawk detects a profile similar to:

```text
Primary task: Classification
Data modality: Tabular
Problem traits: Imbalanced Data, Fraud Detection, Threshold/Cost Sensitive, Deep Learning
Confidence: High
