import * as controller from "../../controllers/global/webhooks"
import { webhookRoutes } from "../endpointGroups"

webhookRoutes
  .post(
    "/api/global/webhooks/users",
    controller.users
  )
