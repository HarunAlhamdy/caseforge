import {
  DEFAULT_SCORING_TEMPLATE,
  type DefaultScoringTemplate,
} from "@/lib/constants/scoring-template";

export interface GlobalConfig extends DefaultScoringTemplate {
  updatedAt: string;
}

let globalConfig: GlobalConfig = {
  ...DEFAULT_SCORING_TEMPLATE,
  updatedAt: new Date().toISOString(),
};

export function getGlobalConfig(): GlobalConfig {
  return structuredClone(globalConfig);
}

export function updateGlobalConfig(
  partial: Partial<DefaultScoringTemplate>,
): GlobalConfig {
  globalConfig = {
    ...globalConfig,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  return getGlobalConfig();
}

export function resetGlobalConfig(): GlobalConfig {
  globalConfig = {
    ...DEFAULT_SCORING_TEMPLATE,
    updatedAt: new Date().toISOString(),
  };
  return getGlobalConfig();
}
