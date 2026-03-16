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
  currentStepId: string
): ScenarioStep | null {
  const stepMap = getScenarioStepMap(scenario);
  const currentStep = stepMap.get(currentStepId);
  if (!currentStep?.nextStepId) {
    return null;
  }

  const nextStep = stepMap.get(currentStep.nextStepId);
  if (!nextStep) {
    throw new Error(`getNextScenarioStep: missing next step ${currentStep.nextStepId}`);
  }

  return nextStep;
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
