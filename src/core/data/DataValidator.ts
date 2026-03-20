import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020";
import dialogSchema from "../../data/schemas/dialog.schema.json";
import imageAreaSchema from "../../data/schemas/image-area.schema.json";
import scenarioSchema from "../../data/schemas/scenario.schema.json";
import stageSchema from "../../data/schemas/stage.schema.json";
import unitCatalogSchema from "../../data/schemas/unit-catalog.schema.json";
import unitDataSchema from "../../data/schemas/unit-data.schema.json";
import type { DialogData } from "./DialogLoader";
import type { ScenarioData } from "./ScenarioLoader";
import type { StageData } from "./StageLoader";
import type { UnitCatalog } from "./StageLoader";

type SchemaKind = "stage" | "scenario" | "dialog" | "unit catalog";

const ajv = new Ajv2020({
  allErrors: true,
  allowUnionTypes: true,
  strict: false
});

ajv.addSchema(imageAreaSchema, "image-area.schema.json");
ajv.addSchema(unitDataSchema, "unit-data.schema.json");
ajv.addSchema(unitCatalogSchema, "unit-catalog.schema.json");
ajv.addSchema(stageSchema, "stage.schema.json");
ajv.addSchema(scenarioSchema, "scenario.schema.json");
ajv.addSchema(dialogSchema, "dialog.schema.json");

const validateStageSchema = ajv.getSchema<StageData>("stage.schema.json");
const validateScenarioSchema = ajv.getSchema<ScenarioData>("scenario.schema.json");
const validateDialogSchema = ajv.getSchema<DialogData>("dialog.schema.json");
const validateUnitCatalogSchema = ajv.getSchema<Record<string, unknown>>("unit-catalog.schema.json");

export function validateStageData(data: unknown, sourceLabel = "stage data"): StageData {
  return validateWithSchema(validateStageSchema, data, "stage", sourceLabel);
}

export function validateDialogData(data: unknown, sourceLabel = "dialog data"): DialogData {
  return validateWithSchema(validateDialogSchema, data, "dialog", sourceLabel);
}

export function validateUnitCatalogData(data: unknown, sourceLabel = "unit catalog data"): UnitCatalog {
  const parsed = validateWithSchema(validateUnitCatalogSchema, data, "unit catalog", sourceLabel);
  const { $schema: _schema, ...catalog } = parsed as Record<string, unknown>;
  return catalog as UnitCatalog;
}

export function validateScenarioData(data: unknown, sourceLabel = "scenario data"): ScenarioData {
  const scenario = validateWithSchema(validateScenarioSchema, data, "scenario", sourceLabel);
  validateScenarioReferences(scenario, sourceLabel);
  return scenario;
}

function validateWithSchema<T>(
  validate: ValidateFunction<T> | undefined,
  data: unknown,
  kind: SchemaKind,
  sourceLabel: string
): T {
  if (!validate) {
    throw new Error(`Schema validator not initialized for ${kind}.`);
  }

  if (validate(data)) {
    return data as T;
  }

  const details = formatAjvErrors(validate.errors ?? []);
  throw new Error(`Invalid ${kind} in ${sourceLabel}:\n${details}`);
}

function formatAjvErrors(errors: ErrorObject[]): string {
  return errors
    .map((error) => `- ${getErrorPath(error)} ${getErrorMessage(error)}`.trimEnd())
    .join("\n");
}

function getErrorPath(error: ErrorObject): string {
  const instancePath = error.instancePath || "/";

  if (error.keyword === "required" && typeof error.params.missingProperty === "string") {
    const basePath = instancePath === "/" ? "" : instancePath;
    return `${basePath}/${error.params.missingProperty}`;
  }

  return instancePath;
}

function getErrorMessage(error: ErrorObject): string {
  if (error.keyword === "additionalProperties" && typeof error.params.additionalProperty === "string") {
    return `contains unsupported property "${error.params.additionalProperty}".`;
  }

  if (error.keyword === "enum" && Array.isArray(error.params.allowedValues)) {
    return `must be one of: ${error.params.allowedValues.join(", ")}.`;
  }

  if (error.keyword === "required" && typeof error.params.missingProperty === "string") {
    return "is required.";
  }

  return `${error.message ?? "is invalid."}.`;
}

function validateScenarioReferences(scenario: ScenarioData, sourceLabel: string): void {
  const stepIds = new Set(scenario.steps.map((step) => step.id));
  const errors: string[] = [];

  if (!stepIds.has(scenario.startingStepId)) {
    errors.push(`- /startingStepId references missing step "${scenario.startingStepId}".`);
  }

  for (const [index, step] of scenario.steps.entries()) {
    const stepPath = `/steps/${index}`;

    if (step.type === "stage") {
      if (step.nextStepId && !stepIds.has(step.nextStepId)) {
        errors.push(`- ${stepPath}/nextStepId references missing step "${step.nextStepId}".`);
      }

      if (step.onSuccess && !stepIds.has(step.onSuccess)) {
        errors.push(`- ${stepPath}/onSuccess references missing step "${step.onSuccess}".`);
      }

      if (step.onFail && !stepIds.has(step.onFail)) {
        errors.push(`- ${stepPath}/onFail references missing step "${step.onFail}".`);
      }
      continue;
    }

    if (step.nextStepId && !stepIds.has(step.nextStepId)) {
      errors.push(`- ${stepPath}/nextStepId references missing step "${step.nextStepId}".`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid scenario references in ${sourceLabel}:\n${errors.join("\n")}`);
  }
}
