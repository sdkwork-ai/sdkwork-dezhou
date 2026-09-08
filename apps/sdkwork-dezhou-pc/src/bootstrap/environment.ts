import manifest from '../../sdkwork.app.config.json';
import { resolveSharedSdkApiBaseUrl } from './resolveSdkApiBaseUrl';

export type SdkworkDezhouPcEnvironment = 'development' | 'test' | 'staging' | 'production';

export type SdkworkDezhouPcConfigProfile = 'dev' | 'test' | 'staging' | 'prod';

export type SdkworkDezhouPcDeploymentMode = 'web';
export type SdkworkDezhouPcRuntimeTarget = 'browser';
export type SdkworkDezhouPcBuildMode = SdkworkDezhouPcEnvironment;

export interface SdkworkDezhouPcAuthRuntimeConfig {
  accessTokenHeader: 'Access-Token';
  authTokenHeader: 'Authorization';
  refreshEnabled: boolean;
  tokenManagerMode: 'appbase-global';
  tokenStorage: 'browser-session';
}

export interface SdkworkDezhouPcI18nRuntimeConfig {
  defaultLocale: string;
  fallbackLocale: string;
  supportedLocales: string[];
}

export interface SdkworkDezhouPcDependencySdkBaseUrls {
  appApiBaseUrl?: string;
  backendApiBaseUrl?: string;
}

export interface SdkworkDezhouPcSdkBaseUrls {
  appApiBaseUrl?: string;
  backendApiBaseUrl?: string;
  dependencySdkBaseUrls?: Record<string, SdkworkDezhouPcDependencySdkBaseUrls>;
  sdkBaseUrl?: string;
}

export interface SdkworkDezhouPcRuntimeConfig {
  appApiBaseUrl: string;
  appDisplayName: string;
  appKey: string;
  auth: SdkworkDezhouPcAuthRuntimeConfig;
  backendApiBaseUrl?: string;
  buildMode: SdkworkDezhouPcBuildMode;
  configProfile: SdkworkDezhouPcConfigProfile;
  deploymentMode: SdkworkDezhouPcDeploymentMode;
  environment: SdkworkDezhouPcEnvironment;
  i18n: SdkworkDezhouPcI18nRuntimeConfig;
  runtimeTarget: SdkworkDezhouPcRuntimeTarget;
  sdkBaseUrl?: string;
  sdkBaseUrls?: SdkworkDezhouPcSdkBaseUrls;
  version: string;
}

const environmentByMode: Record<string, SdkworkDezhouPcEnvironment> = {
  development: 'development',
  dev: 'development',
  production: 'production',
  prod: 'production',
  staging: 'staging',
  test: 'test',
};

const profileByEnvironment: Record<SdkworkDezhouPcEnvironment, SdkworkDezhouPcConfigProfile> = {
  development: 'dev',
  production: 'prod',
  staging: 'staging',
  test: 'test',
};

function envValue(key: string): string | undefined {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function resolveEnvironment(mode: string): SdkworkDezhouPcEnvironment {
  return environmentByMode[mode] ?? 'development';
}

function parseSdkBaseUrls(sdkBaseUrl?: string): SdkworkDezhouPcSdkBaseUrls | undefined {
  const raw = envValue('VITE_SDKWORK_DEZHOU_PC_SDK_BASE_URLS_JSON');
  if (raw) {
    try {
      return JSON.parse(raw) as SdkworkDezhouPcSdkBaseUrls;
    } catch {
      return undefined;
    }
  }

  if (!sdkBaseUrl) {
    return undefined;
  }

  const normalizedSdkBaseUrl = sdkBaseUrl.replace(/\/+$/u, '');
  return {
    appApiBaseUrl: `${normalizedSdkBaseUrl}/app/v3/api`,
    backendApiBaseUrl: `${normalizedSdkBaseUrl}/backend/v3/api`,
    dependencySdkBaseUrls: {
      'sdkwork-iam-app-sdk': {
        appApiBaseUrl: `${normalizedSdkBaseUrl}/app/v3/api`,
      },
      'sdkwork-iam-backend-sdk': {
        backendApiBaseUrl: `${normalizedSdkBaseUrl}/backend/v3/api`,
      },
    },
    sdkBaseUrl: normalizedSdkBaseUrl,
  };
}

export function resolveSdkworkDezhouPcRuntimeConfig(
  mode = import.meta.env.MODE,
): SdkworkDezhouPcRuntimeConfig {
  const environment = resolveEnvironment(mode);
  const sdkBaseUrl = envValue('VITE_SDKWORK_DEZHOU_PC_SDK_BASE_URL');
  const sdkBaseUrls = parseSdkBaseUrls(sdkBaseUrl);
  const defaultApiBase = manifest.runtime.apiBaseUrl.replace(/\/+$/u, '');
  // The shared `SDKWORK_API_BASE_URL` key wins; the per-app keys only survive
  // as a fallback. The shared resolver returns a bare origin, so the SDK API
  // prefixes are re-applied here to keep the config shape unchanged.
  const sharedApiOrigin = resolveSharedSdkApiBaseUrl()?.replace(/\/+$/u, '');

  return {
    appApiBaseUrl:
      (sharedApiOrigin ? `${sharedApiOrigin}/app/v3/api` : undefined) ??
      envValue('VITE_SDKWORK_DEZHOU_PC_APP_API_BASE_URL') ??
      sdkBaseUrls?.appApiBaseUrl ??
      `${defaultApiBase}/app/v3/api`,
    appDisplayName: manifest.app.displayName,
    appKey: manifest.app.key,
    auth: {
      accessTokenHeader: 'Access-Token',
      authTokenHeader: 'Authorization',
      refreshEnabled: true,
      tokenManagerMode: 'appbase-global',
      tokenStorage: 'browser-session',
    },
    backendApiBaseUrl:
      (sharedApiOrigin ? `${sharedApiOrigin}/backend/v3/api` : undefined) ??
      envValue('VITE_SDKWORK_DEZHOU_PC_BACKEND_API_BASE_URL') ?? sdkBaseUrls?.backendApiBaseUrl,
    buildMode: environment,
    configProfile: profileByEnvironment[environment],
    deploymentMode: 'web',
    environment,
    i18n: {
      defaultLocale: envValue('VITE_SDKWORK_DEZHOU_PC_DEFAULT_LOCALE') ?? 'zh-CN',
      fallbackLocale: 'en-US',
      supportedLocales: ['zh-CN', 'en-US'],
    },
    runtimeTarget: 'browser',
    sdkBaseUrl,
    sdkBaseUrls,
    version: manifest.release?.currentVersion ?? '0.1.0',
  };
}
