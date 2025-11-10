export enum WebhookWorkspaceEvent {
  WORKSPACE_CREATED = 'WORKSPACE_CREATED',
  WORKSPACE_DELETED = 'WORKSPACE_DELETED',

  WORKSPACE_MEMBER_CREATED = 'WORKSPACE_MEMBER_CREATED',
  WORKSPACE_MEMBER_ROLE_UPDATED = 'WORKSPACE_MEMBER_ROLE_UPDATED',
  WORKSPACE_MEMBER_DELETED = 'WORKSPACE_MEMBER_DELETED',
}

export interface WebhookUserRequest {
  event: WebhookWorkspaceEvent
  data: Record<string, any>
}

export interface OWSWebhookWorkspaceCreate {
  name: string
  url: string
  userId: string
  workspaceSlug: string
}
