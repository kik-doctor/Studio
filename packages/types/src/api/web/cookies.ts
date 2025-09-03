export interface DatasourceAuthCookie {
  appId: string
  provider: string
}

export interface SessionCookie {
  email: string
  userId: string
  workspaceSlug: string
}

export interface FeatureFlagCookie {
  flags: Record<string, boolean>
}
