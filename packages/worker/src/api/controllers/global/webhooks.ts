import { Ctx, Hosting, SEPARATOR, WebhookWorkspaceEvent, WebhookUserRequest, DocumentType } from "@budibase/types"
import { events, tenancy } from "@budibase/backend-core"
import { checkAnyUserExists } from "../../../utilities/users"
import * as userSdk from "../../../sdk/users"
import env from "../../../environment"

enum MainUserRole {
  ADMIN = 'ADMIN', // Admin
  MANAGER = 'MANAGER', // Builder role in Studio, Member in Planner
}

export const workspaces = async (ctx: Ctx<WebhookUserRequest>) => {
  const { event, data } = ctx.request.body
  const { workspaceSlug: tenantId, email, id, role } = data
  const userId = `${DocumentType.USER}${SEPARATOR}${id}`;

  console.log(`Workspace Webhook is called, event: ${event}, data: ${JSON.stringify(data)}`)

  try {
    switch (event) {
      case WebhookWorkspaceEvent.WORKSPACE_CREATED:
        // Admin user is created with company
        await tenancy.doInTenant(tenantId, async () => {
          const userExists = await checkAnyUserExists()
          if (userExists) {
            ctx.throw(
              403,
              "You cannot initialise once an global user has been created."
            )
          }

          await userSdk.db.createAdminUser(email, tenantId, userId)

          await events.identification.identifyTenantGroup(
            tenantId,
            env.SELF_HOSTED ? Hosting.SELF : Hosting.CLOUD,
            Date.now()
          )
        })
        break
      case WebhookWorkspaceEvent.WORKSPACE_MEMBER_CREATED:
        // User is created
        await tenancy.doInTenant(tenantId, async () => {
          let request: any = {
            email,
            admin: { global: role === MainUserRole.ADMIN },
            roles: {},
            tenantId,
            builder: {
              global: role === MainUserRole.ADMIN,
              creator: role === MainUserRole.MANAGER,
            },
            _id: userId,
            createdAt: Date.now(),
          }

          await userSdk.db.save(request)
        })
        break
      case WebhookWorkspaceEvent.WORKSPACE_MEMBER_ROLE_UPDATED:
        // User role is updated
        await tenancy.doInTenant(tenantId, async () => {
          const user = await userSdk.db.getUser(userId)
          const requestUser = {
            ...user,
            admin: { global: role === MainUserRole.ADMIN },
            builder: {
              ...user.builder,
              global: role === MainUserRole.ADMIN,
              creator: role === MainUserRole.MANAGER,
            }
          }
          await userSdk.db.save(requestUser)
        })
        break
      case WebhookWorkspaceEvent.WORKSPACE_MEMBER_DELETED:
        // User is deleted
        await tenancy.doInTenant(tenantId, async () => {
          await userSdk.db.destroy(userId)
        })
        break
      default:
        break
    }
  } catch (err: any) {
    ctx.throw(err.status || 400, err)
  }

  ctx.body = {
    status: "OK",
  }
}
