export interface DatasourceAuthCookie {
  appId: string
  provider: string
}

export interface SessionCookie {
  email: string
  userId: string
  companyName: string
}

export interface FeatureFlagCookie {
  flags: Record<string, boolean>
}
