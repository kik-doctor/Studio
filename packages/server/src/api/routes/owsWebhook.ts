import * as controller from "../controllers/workspace"
import { owsWebhookRoutes } from "./endpointGroups"

owsWebhookRoutes
  .post(
    "/api/ows-webhooks/applications",
    controller.webhookCreate
  )

owsWebhookRoutes
  .post(
    "/api/ows-webhooks/workspace-plan-update",
    controller.updateWorkspacePlan
  )

owsWebhookRoutes
  .post(
    "/api/ows-webhooks/workspace-name-update",
    controller.updateWorkspaceName
  )