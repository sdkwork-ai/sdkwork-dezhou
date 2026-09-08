import { createClient as createAppbaseAppClient, type SdkworkAppClient } from '@sdkwork/iam-app-sdk';
import {
  createSdkworkAppbasePcAuthRuntime,
  type SdkworkAppbasePcAuthRuntimeComposition,
  type SdkworkAppbasePcAuthRuntimeSdkClient,
} from '@sdkwork/auth-runtime-pc-react';
import type { IamAppContext, IamDeploymentMode, IamEnvironment } from '@sdkwork/iam-contracts';
import type { IamRuntime } from '@sdkwork/iam-runtime';
import { normalizeSdkworkApiBaseUrl } from '@sdkwork/runtime-bootstrap';
import { createClient as createDezhouAppClient } from '@sdkwork/dezhou-app-sdk';

import type { SdkworkDezhouPcRuntimeConfig } from './environment';
import { resolveSharedSdkApiBaseUrl } from './resolveSdkApiBaseUrl';
import {
  createSdkworkDezhouPcSessionStore,
  SDKWORK_DEZHOU_PC_SESSION_STORAGE_KEY,
  type SdkworkDezhouPcSessionSnapshot,
  type SdkworkDezhouPcSessionStore,
} from './sessionStore';
import { createSdkworkDezhouPcSessionTokenManager } from './sessionTokenManager';
import type { SdkworkDezhouPcSdkClientInventory } from './sdkClients';

const APPBASE_APP_SDK_FAMILY_ID = 'sdkwork-iam-app-sdk';
const APP_API_PREFIX = '/app/v3/api';

export type SdkworkDezhouPcIamRuntime = IamRuntime & {
  composition: SdkworkAppbasePcAuthRuntimeComposition;
  session: SdkworkDezhouPcSessionStore;
};

export interface CreateSdkworkDezhouPcIamRuntimeOptions {
  config: SdkworkDezhouPcRuntimeConfig;
  sdkClients: SdkworkDezhouPcSdkClientInventory;
  session?: SdkworkDezhouPcSessionStore;
}

interface DezhouIamSessionLike {
  accessToken?: string;
  authToken?: string;
  refreshToken?: string;
  sessionId?: string;
  context?: IamAppContext;
}

export function createSdkworkDezhouPcIamRuntime(
  options: CreateSdkworkDezhouPcIamRuntimeOptions,
): SdkworkDezhouPcIamRuntime {
  const session = options.session ?? createSdkworkDezhouPcSessionStore(resolveSessionStorage());
  const tokenManager = createSdkworkDezhouPcSessionTokenManager(session);
  const appbaseAppClient = createAppbaseGeneratedAppClient(options.config, tokenManager);
  const composition = createSdkworkAppbasePcAuthRuntime({
    app: {
      appId: options.config.appKey,
      deploymentMode: toIamDeploymentMode(options.config.deploymentMode),
      environment: toIamEnvironment(options.config.environment),
      platform: 'pc',
    },
    baseUrls: {
      appbaseAppApiBaseUrl: resolveAppbaseAppApiBaseUrl(options.config),
    },
    createAppbaseAppClient: () => appbaseAppClient,
    localeProvider: () => options.config.i18n.defaultLocale,
    sdkClients: [options.sdkClients.dezhouAppClient] as SdkworkAppbasePcAuthRuntimeSdkClient[],
    sessionBridge: {
      clearSession: () => {
        session.clearSession();
      },
      commitSession: (nextSession) =>
        commitDezhouIamRuntimeSession(session, nextSession as DezhouIamSessionLike),
      readSession: () => toDezhouIamBridgeSession(session.getSnapshot()),
    },
    tokenManager,
  });

  return {
    ...composition.runtime,
    composition,
    session,
  };
}

export function createSdkworkDezhouPcSdkClientsWithTokenManager(
  config: SdkworkDezhouPcRuntimeConfig,
  tokenManager: ReturnType<typeof createSdkworkDezhouPcSessionTokenManager>,
): SdkworkDezhouPcSdkClientInventory {
  const dezhouAppClient = createDezhouAppClient({
    authMode: 'dual-token',
    baseUrl: normalizeGeneratedSdkBaseUrl(config.appApiBaseUrl, APP_API_PREFIX),
    platform: 'pc',
    tokenManager,
  });

  dezhouAppClient.setTokenManager(tokenManager);

  return {
    appApiBaseUrl: normalizeSdkworkApiBaseUrl(config.appApiBaseUrl, 'app'),
    backendApiBaseUrl: config.backendApiBaseUrl
      ? normalizeSdkworkApiBaseUrl(config.backendApiBaseUrl, 'backend')
      : undefined,
    dezhouAppClient,
    sdkFamilies: {
      app: ['sdkwork-dezhou-app-sdk', 'sdkwork-iam-app-sdk'],
    },
  };
}

function createAppbaseGeneratedAppClient(
  config: SdkworkDezhouPcRuntimeConfig,
  tokenManager: ReturnType<typeof createSdkworkDezhouPcSessionTokenManager>,
): SdkworkAppClient {
  return createAppbaseAppClient({
    authMode: 'dual-token',
    baseUrl: normalizeGeneratedSdkBaseUrl(resolveAppbaseAppApiBaseUrl(config), APP_API_PREFIX),
    platform: 'pc',
    tokenManager,
  });
}

function resolveAppbaseAppApiBaseUrl(config: SdkworkDezhouPcRuntimeConfig): string {
  // The shared `SDKWORK_API_BASE_URL` key resolved through
  // `@sdkwork/sdk-common` wins; the config-derived urls only survive as a
  // fallback.
  return (
    resolveSharedSdkApiBaseUrl() ??
    config.sdkBaseUrls?.dependencySdkBaseUrls?.[APPBASE_APP_SDK_FAMILY_ID]?.appApiBaseUrl ??
    config.appApiBaseUrl
  );
}

function normalizeGeneratedSdkBaseUrl(baseUrl: string, apiPrefix: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/u, '');
  const normalizedApiPrefix = apiPrefix.replace(/\/+$/u, '');
  if (normalizedBaseUrl.endsWith(normalizedApiPrefix)) {
    return normalizedBaseUrl.slice(0, -normalizedApiPrefix.length) || normalizedBaseUrl;
  }
  return normalizedBaseUrl;
}

function commitDezhouIamRuntimeSession(
  session: SdkworkDezhouPcSessionStore,
  iamSession: DezhouIamSessionLike,
): DezhouIamSessionLike | undefined {
  const nextSession: SdkworkDezhouPcSessionSnapshot = {
    ...session.getSnapshot(),
    accessToken: iamSession.accessToken,
    authToken: iamSession.authToken,
    refreshToken: iamSession.refreshToken,
    sessionId: iamSession.sessionId ?? iamSession.context?.sessionId,
    context: iamSession.context
      ? {
          tenantId: iamSession.context.tenantId,
          userId: iamSession.context.userId,
          organizationId: iamSession.context.organizationId,
          sessionId: iamSession.context.sessionId,
          appId: iamSession.context.appId,
          environment: iamSession.context.environment,
          deploymentMode: iamSession.context.deploymentMode,
        }
      : undefined,
  };

  if (!nextSession.context) {
    delete nextSession.context;
  }

  session.setSession(nextSession);
  return toDezhouIamBridgeSession(session.getSnapshot()) ?? undefined;
}

function toDezhouIamBridgeSession(
  snapshot: SdkworkDezhouPcSessionSnapshot,
): DezhouIamSessionLike | null {
  if (!snapshot.authToken && !snapshot.accessToken && !snapshot.refreshToken) {
    return null;
  }

  return {
    ...(snapshot.accessToken ? { accessToken: snapshot.accessToken } : {}),
    ...(snapshot.authToken ? { authToken: snapshot.authToken } : {}),
    ...(snapshot.refreshToken ? { refreshToken: snapshot.refreshToken } : {}),
    ...(snapshot.sessionId ? { sessionId: snapshot.sessionId } : {}),
    ...(snapshot.context?.tenantId && snapshot.context.userId
      ? {
          context: {
            tenantId: snapshot.context.tenantId,
            userId: snapshot.context.userId,
            organizationId: snapshot.context.organizationId,
            sessionId: snapshot.context.sessionId,
            appId: snapshot.context.appId,
            environment: snapshot.context.environment,
            deploymentMode: snapshot.context.deploymentMode,
          } as IamAppContext,
        }
      : {}),
  };
}

function resolveSessionStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  migrateLegacySessionStorage(SDKWORK_DEZHOU_PC_SESSION_STORAGE_KEY);
  return window.localStorage;
}

function migrateLegacySessionStorage(storageKey: string): void {
  const legacySession = window.sessionStorage.getItem(storageKey);
  if (legacySession && !window.localStorage.getItem(storageKey)) {
    window.localStorage.setItem(storageKey, legacySession);
  }
  if (legacySession) {
    window.sessionStorage.removeItem(storageKey);
  }
}

function toIamDeploymentMode(value: SdkworkDezhouPcRuntimeConfig['deploymentMode']): IamDeploymentMode {
  return value === 'web' ? 'saas' : value;
}

function toIamEnvironment(value: SdkworkDezhouPcRuntimeConfig['environment']): IamEnvironment {
  if (value === 'development') {
    return 'dev';
  }
  if (value === 'production') {
    return 'prod';
  }
  if (value === 'staging') {
    return 'test';
  }
  return 'test';
}
