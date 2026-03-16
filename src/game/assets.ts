export interface ImageArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

const assetUrlMap = import.meta.glob("../data/assets/*", {
  eager: true,
  import: "default"
}) as Record<string, string>;

export function assetPathToUrl(assetPath: string): string {
  const normalizedPath = assetPath.startsWith("src/")
    ? assetPath.slice("src/".length)
    : assetPath;
  const modulePath = `../${normalizedPath}`;
  const assetUrl = assetUrlMap[modulePath];

  if (!assetUrl) {
    throw new Error(`assetPathToUrl: unresolved asset path ${assetPath}`);
  }

  return assetUrl;
}

export function getStageBackgroundTextureKey(stageId: string): string {
  return `stage-bg:${stageId}`;
}

export function getUnitTextureKey(unitId: string): string {
  return `unit:${unitId}`;
}
