import * as controller from "../controllers/workspace"
import { owsWebhookRoutes } from "./endpointGroups"

owsWebhookRoutes
  .post(
    "/api/ows-webhooks/applications",
    controller.webhookCreate
  )
