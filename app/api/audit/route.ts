import { NextResponse } from "next/server";

export const runtime = "nodejs";

type NotebookCell = {
  cell_type?: string;
  source?: string | string[];
};

type Finding = {
  severity: "Low" | "Medium" | "High";
  title: string;
  text: string;
};

type SuggestedMarkdownCell = {
  title: string;
  where: string;
  text: string;
};

function sourceToString(source: string | string[] | undefined) {
  if (!source) return "";
  return Array.isArray(source) ? source.join("") : source;
}

function includesAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function firstIndexOfAny(text: string, patterns: string[]) {
  const indices = patterns
    .map((pattern) => text.indexOf(pattern))
    .filter((index) => index >= 0);

  return indices.length > 0 ? Math.min(...indices) : -1;
}

function clampScore(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function confidenceLabel(value: number) {
  if (value >= 80) return "High";
  if (value >= 55) return "Medium";
  return "Low";
}

function computeConfidence(bestScore: number, secondScore: number) {
  if (bestScore <= 1) return 35;

  const separation = bestScore - secondScore;
  const confidence = 55 + (separation / Math.max(bestScore, 1)) * 40;

  return clampScore(confidence, 35, 95);
}

function pickBest(scores: Record<string, number>) {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const best = sorted[0] || ["unknown", 0];
  const second = sorted[1] || ["unknown", 0];

  return {
    label: best[1] >= 2 ? best[0] : "unknown",
    score: best[1],
    secondLabel: second[0],
    secondScore: second[1],
    sorted,
  };
}

function addFinding(
  findings: Finding[],
  severity: Finding["severity"],
  title: string,
  text: string
) {
  findings.push({ severity, title, text });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No notebook file was uploaded." },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".ipynb")) {
      return NextResponse.json(
        { error: "Please upload a .ipynb notebook file." },
        { status: 400 }
      );
    }

    const text = await file.text();
    const notebook = JSON.parse(text);

    const cells: NotebookCell[] = Array.isArray(notebook.cells)
      ? notebook.cells
      : [];

    const codeCells = cells.filter((cell) => cell.cell_type === "code");
    const markdownCells = cells.filter((cell) => cell.cell_type === "markdown");

    const code = codeCells.map((cell) => sourceToString(cell.source)).join("\n");
    const markdown = markdownCells
      .map((cell) => sourceToString(cell.source))
      .join("\n");

    const lowerCode = code.toLowerCase();
    const lowerMarkdown = markdown.toLowerCase();
    const lowerAll = `${lowerCode}\n${lowerMarkdown}`;

    const trainTestSplitIndex = lowerCode.indexOf("train_test_split");
    const smoteIndex = lowerCode.indexOf("smote");
    const fitResampleIndex = lowerCode.indexOf("fit_resample");
    const fitTransformIndex = lowerCode.indexOf("fit_transform");

    const scalerIndex = firstIndexOfAny(lowerCode, [
      "standardscaler",
      "minmaxscaler",
      "robustscaler",
      "normalizer",
    ]);

    const usesTrainTestSplit = trainTestSplitIndex >= 0;

    const usesTrainValidationSplit = includesAny(lowerCode, [
      /validation_split/,
      /x_val/,
      /y_val/,
      /x_valid/,
      /y_valid/,
      /valid_size/,
      /val_size/,
    ]);

    const usesSmote = smoteIndex >= 0 || fitResampleIndex >= 0;

    const smoteBeforeSplit =
      usesSmote &&
      usesTrainTestSplit &&
      Math.min(
        ...[smoteIndex, fitResampleIndex].filter((index) => index >= 0)
      ) < trainTestSplitIndex;

    const scalerBeforeSplit =
      usesTrainTestSplit &&
      fitTransformIndex >= 0 &&
      scalerIndex >= 0 &&
      fitTransformIndex < trainTestSplitIndex;

    const usesAccuracy = includesAny(lowerCode, [
      /accuracy_score/,
      /\baccuracy\b/,
    ]);

    const usesConfusionMatrix = lowerCode.includes("confusion_matrix");
    const usesClassificationReport = lowerCode.includes("classification_report");

    const usesPrecisionRecallF1 = includesAny(lowerCode, [
      /precision_score/,
      /recall_score/,
      /f1_score/,
      /classification_report/,
      /\bf1\b/,
      /\bprecision\b/,
      /\brecall\b/,
    ]);

    const usesRocAuc = includesAny(lowerCode, [
      /roc_auc_score/,
      /roc_curve/,
      /\bauc\(/,
    ]);

    const usesPrauc = includesAny(lowerCode, [
      /average_precision_score/,
      /precision_recall_curve/,
      /pr_auc/,
      /prauc/,
      /pr-auc/,
    ]);

    const usesThresholdTuning = includesAny(lowerCode, [
      /threshold/,
      /predict_proba/,
      /decision_function/,
    ]);

    const usesRandomState = includesAny(lowerCode, [
      /random_state/,
      /np\.random\.seed/,
      /torch\.manual_seed/,
      /tf\.random\.set_seed/,
      /\bseed\(/,
    ]);

    const usesCrossValidation = includesAny(lowerCode, [
      /cross_val_score/,
      /cross_validate/,
      /gridsearchcv/,
      /randomizedsearchcv/,
      /stratifiedkfold/,
      /\bkfold/,
      /timeseriessplit/,
    ]);

    const usesStratify = includesAny(lowerCode, [/stratify\s*=/]);

    const usesPipeline = includesAny(lowerCode, [
      /\bpipeline\(/,
      /make_pipeline/,
      /columntransformer/,
      /pipeline\./,
    ]);

    const usesHyperparameterSearch = includesAny(lowerCode, [
      /gridsearchcv/,
      /randomizedsearchcv/,
      /optuna/,
      /hyperopt/,
      /bayessearchcv/,
    ]);

    const usesBaseline = includesAny(lowerAll, [
      /baseline/,
      /dummyclassifier/,
      /dummyregressor/,
      /naive model/,
      /majority class/,
      /most frequent/,
      /simple baseline/,
    ]);

    const usesRequirementsOrDependencies = includesAny(lowerMarkdown, [
      /requirements/,
      /environment/,
      /dependencies/,
      /package versions/,
      /pip install/,
      /conda/,
    ]);

    const mentionsImbalance = includesAny(lowerAll, [
      /imbalanced/,
      /imbalance/,
      /smote/,
      /class_weight/,
      /minority class/,
      /rare class/,
      /fraud/,
      /oversampling/,
      /undersampling/,
    ]);

    const acknowledgesAccuracyLimitation = includesAny(lowerMarkdown, [
      /accuracy alone/,
      /accuracy is not enough/,
      /accuracy.*misleading/,
      /misleading.*accuracy/,
      /not rely on accuracy/,
      /accuracy.*imbalance/,
      /accuracy.*imbalanced/,
      /accuracy.*minority/,
      /accuracy.*fraud/,
      /high accuracy.*poor/,
    ]);

    const discussesResamplingSafety = includesAny(lowerMarkdown, [
      /smote.*training/,
      /training.*smote/,
      /resampling.*training/,
      /training.*resampling/,
      /only.*training.*smote/,
      /smote.*only.*training/,
      /avoid.*leakage.*smote/,
      /smote.*leakage/,
      /resampling.*leakage/,
      /after.*split.*smote/,
      /smote.*after.*split/,
    ]);

    const mentionsLimitations = includesAny(lowerMarkdown, [
      /limitation/,
      /limitations/,
      /future work/,
      /weakness/,
      /caveat/,
      /constraint/,
      /assumption/,
    ]);

    const mentionsBusinessContext = includesAny(lowerMarkdown, [
      /business/,
      /cost/,
      /false positive/,
      /false negative/,
      /trade-off/,
      /tradeoff/,
      /risk/,
      /operational/,
      /stakeholder/,
    ]);

    const mentionsConclusion = includesAny(lowerMarkdown, [
      /conclusion/,
      /results discussion/,
      /discussion/,
      /summary/,
      /final result/,
    ]);

    const hasMarkdownExplanation = markdown.trim().length > 500;

    const usesRegressionMetrics = includesAny(lowerCode, [
      /mean_squared_error/,
      /root_mean_squared_error/,
      /mean_absolute_error/,
      /r2_score/,
      /\brmse\b/,
      /\bmae\b/,
      /\bmse\b/,
      /\br2\b/,
    ]);

    const usesRegressionModel = includesAny(lowerCode, [
      /linearregression/,
      /ridge/,
      /lasso/,
      /elasticnet/,
      /randomforestregressor/,
      /xgbregressor/,
      /gradientboostingregressor/,
      /svr/,
      /regressor/,
    ]);

    const usesClassificationModel = includesAny(lowerCode, [
      /logisticregression/,
      /randomforestclassifier/,
      /xgbclassifier/,
      /gradientboostingclassifier/,
      /decisiontreeclassifier/,
      /svc/,
      /kneighborsclassifier/,
      /classifier/,
    ]);

    const rawResidualAnalysis = includesAny(lowerAll, [
      /residual analysis/,
      /residual plot/,
      /residuals/,
      /prediction error distribution/,
      /error distribution/,
    ]);

    const usesResidualAnalysis =
      rawResidualAnalysis && (usesRegressionModel || usesRegressionMetrics);

    const usesClustering = includesAny(lowerCode, [
      /kmeans/,
      /dbscan/,
      /agglomerativeclustering/,
      /spectralclustering/,
      /gaussianmixture/,
      /silhouette_score/,
      /\bcluster\b/,
      /\bclustering\b/,
    ]);

    const usesClusterValidation = includesAny(lowerCode, [
      /silhouette_score/,
      /davies_bouldin_score/,
      /calinski_harabasz_score/,
      /inertia_/,
      /\belbow\b/,
    ]);

    const usesTimeSeriesSignals = includesAny(lowerAll, [
      /timeseriessplit/,
      /\barima\b/,
      /\bsarima\b/,
      /\bprophet\b/,
      /\bforecasting\b/,
      /\btime series\b/,
      /walk-forward/,
      /backtesting/,
      /rolling forecast/,
      /temporal validation/,
      /chronological split/,
    ]);

    const usesNlpSignals = includesAny(lowerAll, [
      /tfidfvectorizer/,
      /countvectorizer/,
      /\btokenizer\b/,
      /tokenisation/,
      /tokenization/,
      /\bnltk\b/,
      /\bspacy\b/,
      /\btransformers\b/,
      /\bbert\b/,
      /sentence-transformer/,
      /text classification/,
      /sentiment analysis/,
      /\bcorpus\b/,
    ]);

    const usesComputerVisionSignals = includesAny(lowerCode, [
      /\bimport\s+cv2\b/,
      /\bcv2\./,
      /\bopencv\b/,
      /from\s+pil\s+import/,
      /image\.open\(/,
      /\bimread\(/,
      /\btorchvision\b/,
      /imagedatagenerator/,
      /image_dataset_from_directory/,
      /conv2d/,
      /\bcnn\b/,
      /convolutional/,
      /image classification/,
    ]);

    const hasDeepLearningFramework = includesAny(lowerCode, [
      /import\s+tensorflow/,
      /from\s+tensorflow/,
      /import\s+keras/,
      /from\s+keras/,
      /import\s+torch/,
      /from\s+torch/,
      /torch\.nn/,
      /tf\.keras/,
      /keras\.models/,
    ]);

    const hasDeepLearningArchitecture = includesAny(lowerCode, [
      /sequential\(/,
      /dense\(/,
      /conv2d/,
      /lstm/,
      /dropout\(/,
      /model\.add\(/,
      /nn\.module/,
      /neural network/,
    ]);

    const usesDeepLearningSignals =
      hasDeepLearningFramework && hasDeepLearningArchitecture;

    const usesEarlyStopping = includesAny(lowerCode, [
      /earlystopping/,
      /early_stopping/,
    ]);

    const usesLearningCurves = includesAny(lowerAll, [
      /learning curve/,
      /loss curve/,
      /val_loss/,
      /validation loss/,
      /history\.history/,
    ]);

    const usesAnomalySignals = includesAny(lowerAll, [
      /isolationforest/,
      /oneclasssvm/,
      /localoutlierfactor/,
      /\banomaly\b/,
      /outlier detection/,
      /\bfraud\b/,
      /rare event/,
    ]);

    const usesRecommenderSignals = includesAny(lowerAll, [
      /recommender system/,
      /recommendation system/,
      /collaborative filtering/,
      /matrix factorization/,
      /\bndcg\b/,
      /precision@k/,
      /recall@k/,
      /map@k/,
    ]);

    const usesModelPersistence = includesAny(lowerCode, [
      /joblib\.dump/,
      /pickle\.dump/,
      /save_model/,
      /model\.save/,
      /\.pt/,
      /\.pth/,
      /\.h5/,
    ]);

    const usesMultipleModels =
      [
        usesClassificationModel,
        usesRegressionModel,
        includesAny(lowerCode, [
          /\bxgb/,
          /randomforest/,
          /\bsvm\b/,
          /logisticregression/,
          /linearregression/,
        ]),
      ].filter(Boolean).length >= 2;

    const hasStrongImbalanceMetrics =
      usesPrauc || usesPrecisionRecallF1 || usesClassificationReport;

    const hasStrongEvaluationSet =
      usesTrainTestSplit || usesCrossValidation || usesTrainValidationSplit;

    const taskScores: Record<string, number> = {
      classification: 0,
      regression: 0,
      clustering: 0,
      forecasting: 0,
      recommendation: 0,
      anomaly_detection: 0,
    };

    if (usesClassificationModel) taskScores.classification += 3;
    if (usesClassificationReport) taskScores.classification += 3;
    if (usesConfusionMatrix) taskScores.classification += 2;
    if (usesAccuracy) taskScores.classification += 1;
    if (usesPrecisionRecallF1) taskScores.classification += 2;
    if (usesRocAuc || usesPrauc) taskScores.classification += 2;
    if (usesSmote || usesThresholdTuning) taskScores.classification += 2;

    if (usesRegressionModel) taskScores.regression += 3;
    if (usesRegressionMetrics) taskScores.regression += 4;
    if (usesResidualAnalysis) taskScores.regression += 2;

    if (usesClustering) taskScores.clustering += 4;
    if (usesClusterValidation) taskScores.clustering += 2;

    if (usesTimeSeriesSignals) taskScores.forecasting += 4;
    if (includesAny(lowerAll, [/\bforecasting\b/, /\bforecast model\b/])) {
      taskScores.forecasting += 2;
    }

    if (usesRecommenderSignals) taskScores.recommendation += 5;

    if (usesAnomalySignals) taskScores.anomaly_detection += 3;
    if (lowerAll.includes("fraud")) taskScores.anomaly_detection += 1;

    const taskPick = pickBest(taskScores);
    const primaryTask = taskPick.label;
    const taskConfidence = computeConfidence(
      taskPick.score,
      taskPick.secondScore
    );

    const secondaryTasks = taskPick.sorted
      .filter(
        ([task, score]) =>
          task !== primaryTask && score >= 4 && score >= taskPick.score * 0.55
      )
      .map(([task]) => task);

    const modalityScores: Record<string, number> = {
      tabular: 0,
      text: 0,
      image: 0,
      time_series: 0,
      unknown: 0,
    };

    if (
      includesAny(lowerCode, [
        /\bpandas\b/,
        /\bdataframe\b/,
        /read_csv/,
        /\.csv/,
        /\bsklearn\b/,
        /scikit-learn/,
      ])
    ) {
      modalityScores.tabular += 4;
    }

    if (usesNlpSignals) modalityScores.text += 6;
    if (usesComputerVisionSignals) modalityScores.image += 6;
    if (usesTimeSeriesSignals) modalityScores.time_series += 6;

    if (
      modalityScores.tabular >= 4 &&
      !usesNlpSignals &&
      !usesComputerVisionSignals &&
      !usesTimeSeriesSignals
    ) {
      modalityScores.tabular += 3;
    }

    if (
      modalityScores.text === 0 &&
      modalityScores.image === 0 &&
      modalityScores.time_series === 0 &&
      modalityScores.tabular === 0
    ) {
      modalityScores.unknown = 1;
    }

    const modalityPick = pickBest(modalityScores);
    const dataModality = modalityPick.label;

    const problemTraits = unique([
      mentionsImbalance ? "imbalanced_data" : "",
      lowerAll.includes("fraud") ? "fraud_detection" : "",
      usesThresholdTuning || mentionsBusinessContext
        ? "threshold_or_cost_sensitive"
        : "",
      usesDeepLearningSignals ? "deep_learning" : "",
      usesAnomalySignals ? "anomaly_or_rare_event_context" : "",
      usesNlpSignals ? "text_data" : "",
      usesComputerVisionSignals ? "image_data" : "",
      usesTimeSeriesSignals ? "temporal_or_time_series_data" : "",
    ]);

    const appliedPacks = unique([
      "universal",
      primaryTask !== "unknown" ? primaryTask : "",
      dataModality !== "unknown" ? dataModality : "",
      mentionsImbalance ? "imbalanced_data" : "",
      usesDeepLearningSignals ? "deep_learning" : "",
      usesTimeSeriesSignals ? "time_series" : "",
      usesNlpSignals ? "nlp" : "",
      usesComputerVisionSignals ? "computer_vision" : "",
      "portfolio_and_reporting",
    ]);

    const isClassification = primaryTask === "classification";
    const isRegression = primaryTask === "regression";
    const isClustering = primaryTask === "clustering";
    const isForecasting = primaryTask === "forecasting";
    const isRecommendation = primaryTask === "recommendation";
    const isAnomaly = primaryTask === "anomaly_detection";

    const randomSplitOnTimeSeries =
      isForecasting &&
      usesTrainTestSplit &&
      !lowerCode.includes("shuffle=false");

    let leakageRisk = 18;

    if (!usesTrainTestSplit && !usesCrossValidation && !isClustering) {
      leakageRisk += 25;
    }

    if (smoteBeforeSplit) leakageRisk += 38;
    if (scalerBeforeSplit) leakageRisk += 28;
    if (usesSmote && !usesPipeline) leakageRisk += 5;
    if (randomSplitOnTimeSeries) leakageRisk += 25;
    if (usesPipeline) leakageRisk -= 8;
    if (usesStratify && isClassification) leakageRisk -= 4;
    if (usesSmote && discussesResamplingSafety) leakageRisk -= 3;

    leakageRisk = clampScore(leakageRisk, 8, 95);

    let metricQuality = 40;

    if (isClassification || primaryTask === "unknown") {
      if (usesConfusionMatrix) metricQuality += 10;
      if (usesClassificationReport) metricQuality += 10;
      if (usesPrecisionRecallF1) metricQuality += 8;
      if (usesRocAuc) metricQuality += 7;
      if (usesPrauc) metricQuality += 10;
      if (usesThresholdTuning) metricQuality += 8;

      if (
        usesAccuracy &&
        mentionsImbalance &&
        !hasStrongImbalanceMetrics &&
        !acknowledgesAccuracyLimitation
      ) {
        metricQuality -= 15;
      }

      if (usesAccuracy && !usesPrecisionRecallF1 && isClassification) {
        metricQuality -= 5;
      }

      if (
        usesAccuracy &&
        mentionsImbalance &&
        hasStrongImbalanceMetrics &&
        acknowledgesAccuracyLimitation
      ) {
        metricQuality += 4;
      }
    }

    if (isRegression) {
      metricQuality = 42;
      if (usesRegressionMetrics) metricQuality += 25;
      if (usesResidualAnalysis) metricQuality += 15;
      if (usesBaseline) metricQuality += 8;
      if (usesCrossValidation) metricQuality += 7;
    }

    if (isClustering) {
      metricQuality = 38;
      if (usesClusterValidation) metricQuality += 25;
      if (hasMarkdownExplanation) metricQuality += 10;
      if (lowerMarkdown.includes("cluster interpretation")) metricQuality += 10;
    }

    if (isForecasting) {
      metricQuality = 40;
      if (usesRegressionMetrics) metricQuality += 18;
      if (usesTimeSeriesSignals) metricQuality += 12;
      if (usesCrossValidation || lowerCode.includes("timeseriessplit")) {
        metricQuality += 12;
      }
      if (randomSplitOnTimeSeries) metricQuality -= 15;
    }

    if (isRecommendation) {
      metricQuality = 40;
      if (
        includesAny(lowerAll, [
          /\bndcg\b/,
          /precision@k/,
          /recall@k/,
          /map@k/,
        ])
      ) {
        metricQuality += 25;
      }
    }

    if (isAnomaly) {
      metricQuality = Math.max(metricQuality, 45);
      if (usesPrauc || usesPrecisionRecallF1) metricQuality += 10;
      if (usesThresholdTuning) metricQuality += 8;
    }

    if (usesBaseline) metricQuality += 5;
    if (usesMultipleModels) metricQuality += 5;

    metricQuality = clampScore(metricQuality, 15, 92);

    let reproducibility = 35;

    if (usesRandomState) reproducibility += 24;
    if (usesCrossValidation) reproducibility += 10;
    if (usesPipeline) reproducibility += 10;
    if (usesRequirementsOrDependencies) reproducibility += 8;
    if (hasMarkdownExplanation) reproducibility += 5;
    if (usesModelPersistence) reproducibility += 5;
    if (!usesRandomState && usesDeepLearningSignals) reproducibility -= 8;

    reproducibility = clampScore(reproducibility, 10, 90);

    let portfolioReadiness = 42;

    if (hasMarkdownExplanation) portfolioReadiness += 14;
    if (mentionsLimitations) portfolioReadiness += 13;
    if (mentionsBusinessContext) portfolioReadiness += 9;
    if (mentionsConclusion) portfolioReadiness += 7;
    if (usesConfusionMatrix || usesClassificationReport || usesRegressionMetrics) {
      portfolioReadiness += 7;
    }
    if (usesBaseline) portfolioReadiness += 5;
    if (usesModelPersistence) portfolioReadiness += 3;
    if (acknowledgesAccuracyLimitation) portfolioReadiness += 3;
    if (discussesResamplingSafety) portfolioReadiness += 3;

    portfolioReadiness = clampScore(portfolioReadiness, 15, 92);

    const findings: Finding[] = [];

    if (smoteBeforeSplit) {
      addFinding(
        findings,
        "High",
        "Possible leakage: SMOTE appears before train/test split",
        "Resampling should normally be applied only to the training set. Applying SMOTE before the split can leak synthetic information into the test set."
      );
    }

    if (scalerBeforeSplit) {
      addFinding(
        findings,
        "High",
        "Possible preprocessing leakage",
        "A scaler and fit_transform appear before train/test split. Preprocessing should usually be fitted on the training data only."
      );
    }

    if (randomSplitOnTimeSeries) {
      addFinding(
        findings,
        "High",
        "Possible temporal leakage from random splitting",
        "The project appears to contain time-series or forecasting signals, but also uses train_test_split. Time-dependent projects usually require chronological splits or backtesting."
      );
    }

    if (
      !hasStrongEvaluationSet &&
      !isClustering &&
      primaryTask !== "unknown"
    ) {
      addFinding(
        findings,
        "High",
        "No clear validation strategy detected",
        "ModelHawk did not detect a train/test split, validation split or cross-validation strategy. A project should clearly separate training and evaluation data."
      );
    }

    if (
      usesAccuracy &&
      mentionsImbalance &&
      isClassification &&
      !hasStrongImbalanceMetrics &&
      !acknowledgesAccuracyLimitation
    ) {
      addFinding(
        findings,
        "Medium",
        "Accuracy may be misleading",
        "The project appears to involve class imbalance, but ModelHawk did not detect enough evidence that accuracy is supported by stronger minority-class metrics such as recall, F1 or PR-AUC."
      );
    }

    if (
      usesAccuracy &&
      mentionsImbalance &&
      isClassification &&
      hasStrongImbalanceMetrics &&
      !acknowledgesAccuracyLimitation
    ) {
      addFinding(
        findings,
        "Low",
        "Accuracy appears in an imbalanced context",
        "Stronger metrics were detected, but the notebook should explicitly explain why accuracy is not sufficient for this problem."
      );
    }

    if (
      isClassification &&
      mentionsImbalance &&
      !usesPrauc &&
      !usesPrecisionRecallF1
    ) {
      addFinding(
        findings,
        "Medium",
        "Imbalanced classification metrics look incomplete",
        "The notebook appears to involve class imbalance, but ModelHawk did not detect strong minority-class metrics such as PR-AUC, recall or F1."
      );
    }

    if (
      isClassification &&
      mentionsImbalance &&
      usesTrainTestSplit &&
      !usesStratify
    ) {
      addFinding(
        findings,
        "Medium",
        "Stratified splitting should be verified",
        "For imbalanced classification, the train/test split should usually preserve class proportions. ModelHawk did not detect stratify= in the split."
      );
    }

    if (
      (isClassification || isAnomaly) &&
      (mentionsImbalance || mentionsBusinessContext) &&
      !usesThresholdTuning
    ) {
      addFinding(
        findings,
        "Medium",
        "Threshold choice is not clearly justified",
        "No clear threshold tuning was detected. For fraud, risk or imbalanced classification problems, the decision threshold should usually be justified."
      );
    }

    if (isRegression && !usesRegressionMetrics) {
      addFinding(
        findings,
        "High",
        "Regression metrics not clearly detected",
        "This appears to be a regression project, but ModelHawk did not detect common regression metrics such as MAE, RMSE or R2."
      );
    }

    if (isRegression && !usesResidualAnalysis) {
      addFinding(
        findings,
        "Medium",
        "Residual analysis missing or weak",
        "For regression projects, residual analysis helps reveal systematic errors, outliers and model bias. ModelHawk did not detect a clear residual analysis."
      );
    }

    if (isClustering && !usesClusterValidation) {
      addFinding(
        findings,
        "Medium",
        "Clustering validation is not clearly detected",
        "This appears to be a clustering project, but ModelHawk did not detect validation signals such as silhouette score, Davies-Bouldin score or elbow analysis."
      );
    }

    if (usesDeepLearningSignals && !usesEarlyStopping && !usesLearningCurves) {
      addFinding(
        findings,
        "Medium",
        "Deep learning training diagnostics may be weak",
        "The notebook appears to use deep learning, but ModelHawk did not detect early stopping or learning-curve discussion. These are useful for diagnosing overfitting."
      );
    }

    if (!usesBaseline && !isClustering) {
      addFinding(
        findings,
        "Medium",
        "Baseline model not clearly detected",
        "A strong ML project should compare the chosen model against a simple baseline. ModelHawk did not detect a clear baseline."
      );
    }

    if (!usesRandomState && !isClustering) {
      addFinding(
        findings,
        "Medium",
        "Reproducibility issue",
        "No fixed random seed was detected. Add random_state or equivalent seed settings to make results easier to reproduce."
      );
    }

    if (!mentionsLimitations) {
      addFinding(
        findings,
        "Low",
        "Limitations section missing or weak",
        "The notebook/report does not clearly discuss limitations. A strong portfolio project should explain what the model cannot prove."
      );
    }

    if (!hasMarkdownExplanation) {
      addFinding(
        findings,
        "Low",
        "Notebook explanation may be too thin",
        "The markdown content appears limited. A portfolio-ready project should explain the problem, methodology, results and limitations clearly."
      );
    }

    if (findings.length === 0) {
      addFinding(
        findings,
        "Low",
        "No major static red flags detected",
        "The notebook passed the first static checks. ModelHawk detected several positive signals, although a deeper audit would require executing the workflow and testing robustness."
      );
    }

    const goodPractices = unique([
      usesTrainTestSplit ? "Clear train/test split signal detected." : "",
      usesStratify
        ? "Stratified split detected, useful for imbalanced classification."
        : "",
      usesPipeline
        ? "Pipeline or ColumnTransformer detected, which can reduce preprocessing leakage risk."
        : "",
      usesCrossValidation
        ? "Cross-validation or advanced validation signal detected."
        : "",
      usesRandomState ? "Random seed or random_state detected." : "",
      usesPrauc ? "PR-AUC or precision-recall evaluation detected." : "",
      usesRocAuc ? "ROC-AUC evaluation detected." : "",
      usesPrecisionRecallF1
        ? "Precision, recall or F1-style evaluation detected."
        : "",
      usesThresholdTuning
        ? "Threshold or probability-based decision logic detected."
        : "",
      usesHyperparameterSearch ? "Hyperparameter search detected." : "",
      usesBaseline ? "Baseline comparison signal detected." : "",
      acknowledgesAccuracyLimitation && hasStrongImbalanceMetrics
        ? "Accuracy limitation appears to be acknowledged and supported by stronger metrics."
        : "",
      usesSmote && discussesResamplingSafety
        ? "Resampling/leakage awareness detected in the notebook explanation."
        : "",
      usesDeepLearningSignals && (usesEarlyStopping || usesLearningCurves)
        ? "Deep learning diagnostics such as early stopping or learning curves detected."
        : "",
      mentionsLimitations ? "Limitations or future work section detected." : "",
      mentionsBusinessContext ? "Business/cost context detected." : "",
      hasMarkdownExplanation ? "Substantial markdown explanation detected." : "",
    ]);

    const risksToVerify = unique([
      usesSmote && !smoteBeforeSplit
        ? "Verify that SMOTE/resampling is applied only to the training data in every experiment and cross-validation workflow."
        : "",
      usesAccuracy && mentionsImbalance && !acknowledgesAccuracyLimitation
        ? "Verify that accuracy is not presented as the main success criterion for an imbalanced problem."
        : "",
      usesAccuracy &&
      mentionsImbalance &&
      acknowledgesAccuracyLimitation &&
      hasStrongImbalanceMetrics
        ? "Accuracy is present, but stronger metrics and explanation were detected. Verify that the final conclusion prioritises minority-class performance."
        : "",
      isForecasting && usesTrainTestSplit
        ? "Verify that the split respects time order and does not leak future information."
        : "",
      usesPipeline
        ? ""
        : "Verify that preprocessing is not fitted on the full dataset before splitting.",
      !usesBaseline
        ? "Verify whether the chosen model meaningfully outperforms a simple baseline."
        : "",
      metricQuality >= 88
        ? "Metric coverage looks strong statically, but verify that the metrics are calculated on held-out data only."
        : "",
    ]);

    const priorityFixes = unique([
      smoteBeforeSplit || scalerBeforeSplit
        ? "Move preprocessing/resampling inside the training workflow and rerun evaluation."
        : "",
      isClassification && mentionsImbalance && !usesPrauc
        ? "Add PR-AUC or precision-recall analysis for the minority class."
        : "",
      isClassification && mentionsImbalance && !usesStratify
        ? "Use stratified splitting or explain why it is not appropriate."
        : "",
      isClassification &&
      mentionsImbalance &&
      usesAccuracy &&
      !acknowledgesAccuracyLimitation
        ? "Explicitly explain why accuracy is insufficient for this imbalanced problem."
        : "",
      !usesBaseline ? "Add a simple baseline model for comparison." : "",
      !usesRandomState ? "Add fixed seeds for reproducibility." : "",
      !mentionsLimitations ? "Add a limitations/future work section." : "",
      isRegression && !usesResidualAnalysis
        ? "Add residual analysis and error distribution discussion."
        : "",
      isForecasting && randomSplitOnTimeSeries
        ? "Replace random splitting with chronological split or time-series backtesting."
        : "",
    ]);

    const recommendations = unique([
      "State the project type, target variable and evaluation objective clearly.",
      hasStrongImbalanceMetrics
        ? "Make the final metric choice explicit and explain which metric should drive model selection."
        : "Explain why the chosen metrics match the problem context.",
      usesBaseline
        ? "Strengthen the final discussion by clearly comparing the selected model against the baseline."
        : "Include a baseline model and compare it against the final model.",
      discussesResamplingSafety
        ? "Keep the resampling/leakage explanation close to the validation methodology."
        : "Document the validation strategy and justify how leakage was avoided.",
      usesRequirementsOrDependencies
        ? "Make dependency versions and rerun instructions easy to find."
        : "Add reproducibility details such as seeds, dependencies and rerun instructions.",
      mentionsLimitations
        ? "Connect the limitations section more directly to deployment risk and future validation."
        : "Add a limitations section explaining what the model cannot prove.",
      mentionsBusinessContext
        ? "Strengthen the business/cost interpretation of false positives and false negatives."
        : "Add a short paragraph connecting model errors to real-world consequences.",
    ]);

    const suggestedMarkdownCells: SuggestedMarkdownCell[] = [];

    if (isClassification && mentionsImbalance && !acknowledgesAccuracyLimitation) {
      suggestedMarkdownCells.push({
        title: "Why accuracy is not enough",
        where: "After the evaluation metrics section",
        text:
          "Because this project appears to involve class imbalance, accuracy alone may be misleading. A model can achieve high accuracy by mostly predicting the majority class while failing to identify the minority class. For this reason, metrics such as precision, recall, F1-score and PR-AUC should be discussed alongside accuracy.",
      });
    }

    if (usesSmote && !discussesResamplingSafety) {
      suggestedMarkdownCells.push({
        title: "How resampling was handled",
        where: "Before or after the preprocessing section",
        text:
          "Resampling methods such as SMOTE should only be applied to the training data. This avoids leaking synthetic information into the test set and helps ensure that the final evaluation reflects performance on unseen data.",
      });
    }

    if (!mentionsLimitations) {
      suggestedMarkdownCells.push({
        title: "Limitations and future work",
        where: "Near the end of the notebook",
        text:
          "This project has several limitations. The results are based on the available dataset and may not fully generalise to future or external data. Additional validation, robustness checks and analysis of potential data drift would be needed before using the model in a real-world setting.",
      });
    }

    if (!usesBaseline) {
      suggestedMarkdownCells.push({
        title: "Baseline comparison",
        where: "Before presenting the final model",
        text:
          "A simple baseline model provides a reference point for evaluating whether the chosen model adds real value. The final model should be compared against a naive or simple baseline using the same evaluation metrics.",
      });
    }

    if (isRegression && !usesResidualAnalysis) {
      suggestedMarkdownCells.push({
        title: "Residual analysis",
        where: "After regression metrics",
        text:
          "Regression metrics summarise average performance, but residual analysis helps identify systematic errors, outliers and regions where the model performs poorly. Plotting residuals can reveal whether the model assumptions are reasonable.",
      });
    }

    if (
      isClassification &&
      mentionsImbalance &&
      hasStrongImbalanceMetrics &&
      acknowledgesAccuracyLimitation
    ) {
      suggestedMarkdownCells.push({
        title: "Final metric justification",
        where: "Before the final model selection or conclusion",
        text:
          "Although accuracy is reported, the final model should be selected using metrics that better reflect minority-class performance. In this project, precision, recall, F1-score and PR-AUC provide a more informative view of fraud detection performance than accuracy alone.",
      });
    }

    const vivaQuestions = unique([
      isClassification && mentionsImbalance
        ? "Why is accuracy not enough for this project?"
        : "Why did you choose your main evaluation metric?",
      usesSmote
        ? "How did you make sure resampling did not create leakage?"
        : isClassification
          ? "How did you handle class imbalance or rare events?"
          : "How did you make sure your preprocessing did not create leakage?",
      usesThresholdTuning
        ? "How did you choose your decision threshold?"
        : isClassification || isAnomaly
          ? "Why did you keep or change the default decision threshold?"
          : "How did you decide that the model performance was good enough?",
      hasStrongImbalanceMetrics
        ? "Which metric would you prioritise if precision and recall move in opposite directions?"
        : "What would happen if false positives and false negatives had different costs?",
      isForecasting
        ? "How did you avoid using future information during validation?"
        : "How would you test whether this model generalises to new data?",
      "What are the main limitations of this project?",
    ]);

    const projectProfile = {
      primaryTask,
      secondaryTasks,
      dataModality,
      problemTraits,
      confidence: taskConfidence,
      confidenceLabel: confidenceLabel(taskConfidence),
      appliedPacks,
    };

    return NextResponse.json({
      fileName: file.name,
      projectProfile,
      summary: {
        totalCells: cells.length,
        codeCells: codeCells.length,
        markdownCells: markdownCells.length,
      },
      signals: {
        usesTrainTestSplit,
        usesTrainValidationSplit,
        usesSmote,
        smoteBeforeSplit,
        scalerBeforeSplit,
        usesAccuracy,
        usesConfusionMatrix,
        usesClassificationReport,
        usesPrecisionRecallF1,
        usesRocAuc,
        usesPrauc,
        usesThresholdTuning,
        usesRandomState,
        usesCrossValidation,
        usesStratify,
        usesPipeline,
        usesHyperparameterSearch,
        usesBaseline,
        usesRequirementsOrDependencies,
        usesRegressionMetrics,
        usesResidualAnalysis,
        usesRegressionModel,
        usesClassificationModel,
        usesClustering,
        usesClusterValidation,
        usesTimeSeriesSignals,
        usesNlpSignals,
        usesComputerVisionSignals,
        usesDeepLearningSignals,
        usesEarlyStopping,
        usesLearningCurves,
        usesAnomalySignals,
        usesRecommenderSignals,
        usesModelPersistence,
        usesMultipleModels,
        acknowledgesAccuracyLimitation,
        discussesResamplingSafety,
        mentionsImbalance,
        hasMarkdownExplanation,
        mentionsLimitations,
        mentionsBusinessContext,
        mentionsConclusion,
      },
      scores: {
        leakageRisk,
        metricQuality,
        reproducibility,
        portfolioReadiness,
      },
      findings,
      goodPractices,
      risksToVerify,
      priorityFixes,
      recommendations,
      suggestedMarkdownCells,
      vivaQuestions,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "The notebook could not be analysed. Please make sure it is a valid .ipynb file.",
      },
      { status: 500 }
    );
  }
}