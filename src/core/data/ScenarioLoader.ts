import type { StageData } from "./StageLoader";
import type { DialogData } from "./DialogLoader";

export interface ScenarioStep {
  id: string;
  type: "stage" | "dialogue";
  title: string;
  description?: string;
  stageId?: string;
  dialogId?: string;
  nextStepId?: string;
  onSuccess?: string;
  onFail?: string;
  speaker?: string;
  lines?: string[];
}

export interface ScenarioData {
  id: string;
  title: string;
  description?: string;
  startingStepId: string;
  steps: ScenarioStep[];
}

export interface ScenarioDefinition {
  scenario: ScenarioData;
  stages: Record<string, StageData>;
  dialogs: Record<string, DialogData>;
}

export function getScenarioStepMap(scenario: ScenarioData): Map<string, ScenarioStep> {
  return new Map(scenario.steps.map((step) => [step.id, step]));
}

export function getStartingStep(scenario: ScenarioData): ScenarioStep {
  const stepMap = getScenarioStepMap(scenario);
  const step = stepMap.get(scenario.startingStepId);

  if (!step) {
    throw new Error(`getStartingStep: missing starting step ${scenario.startingStepId}`);
  }

  return step;
}

export function getNextScenarioStep(
  scenario: ScenarioData,
  currentStepId: string,
  result: "default" | "success" | "fail" = "default"
): ScenarioStep | null {
  const stepMap = getScenarioStepMap(scenario);
  const currentStep = stepMap.get(currentStepId);
  if (!currentStep) {
    return null;
  }

  const nextStepId = getNextStepIdForResult(currentStep, result);
  if (!nextStepId) {
    return null;
  }

  const nextStep = stepMap.get(nextStepId);
  if (!nextStep) {
    throw new Error(`getNextScenarioStep: missing next step ${nextStepId}`);
  }

  return nextStep;
}

function getNextStepIdForResult(
  step: ScenarioStep,
  result: "default" | "success" | "fail"
): string | undefined {
  if (step.type !== "stage") {
    return step.nextStepId;
  }

  if (result === "success") {
    return step.onSuccess ?? step.nextStepId;
  }

  if (result === "fail") {
    return step.onFail;
  }

  return step.nextStepId;
}

export function getStageForScenarioStep(
  definition: ScenarioDefinition,
  step: ScenarioStep
): StageData | null {
  if (step.type !== "stage" || !step.stageId) {
    return null;
  }

  const stage = definition.stages[step.stageId];
  if (!stage) {
    throw new Error(`getStageForScenarioStep: missing stage ${step.stageId}`);
  }

  return stage;
}

export function getDialogForScenarioStep(
  definition: ScenarioDefinition,
  step: ScenarioStep
): DialogData | null {
  if (step.type !== "dialogue" || !step.dialogId) {
    return null;
  }

  const dialog = definition.dialogs[step.dialogId];
  if (!dialog) {
    throw new Error(`getDialogForScenarioStep: missing dialog ${step.dialogId}`);
  }

  return dialog;
}
