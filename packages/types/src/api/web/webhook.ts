export enum WebhookUserEvent {
  USER_CREATED = "USER_CREATED",
  ADMIN_USER_CREATED = "ADMIN_USER_CREATED", // When admin user is sign up with tenant creation
  USER_ROLE_UPDATED = "USER_ROLE_UPDATED",
  USER_DELETED = "USER_DELETED",
}

export interface WebhookUserRequest {
  event: WebhookUserEvent
  data: Record<string, any>
}
