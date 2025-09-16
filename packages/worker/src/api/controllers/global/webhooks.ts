import {
  Ctx,
  Hosting,
  SEPARATOR,
  WebhookWorkspaceEvent,
  WebhookUserRequest,
  DocumentType,
} from "@budibase/types"
import { events, tenancy } from "@budibase/backend-core"
import { checkAnyUserExists } from "../../../utilities/users"
import * as userSdk from "../../../sdk/users"
import env from "../../../environment"
import * as tenantSdk from "../../../sdk/tenants"

enum MainUserRole {
  ADMIN = 'ADMIN', // Admin
  MANAGER = 'MANAGER', // Builder role in Studio, Member in Planner
}

export const workspaces = async (ctx: Ctx<WebhookUserRequest>) => {
  const { event, data } = ctx.request.body
  const { workspaceSlug: tenantId, email, userId: _userId, role } = data
  const userId = `${DocumentType.USER}${SEPARATOR}${tenantId}${SEPARATOR}${_userId}`;

  console.log(`Workspace Webhook is called, event: ${event}, data: ${JSON.stringify(data)}`)

  try {
    switch (event) {
      case WebhookWorkspaceEvent.WORKSPACE_CREATED:
        // Workspace is created by admin user.
        await tenancy.doInTenant(tenantId, async () => {
          const userExists = await checkAnyUserExists()
          if (userExists) {
            // Webhook should be idempotent.
            // If users exist, skip creating the admin user
            ctx.body = {
              status: "OK",
            }
            return
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
        // Workspace member is created
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
        // Workspace member role is updated
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
        // Workspace member is deleted
        await tenancy.doInTenant(tenantId, async () => {
          try {
            await userSdk.db.destroy(userId)
          } catch (err: any) {
            if (err.message === 'CouchDB error: deleted') {
              // Webhook should be idempotent.
              // If user is deleted already, return
              return
            } else {
              throw err
            }
          }
        })
        break
      case WebhookWorkspaceEvent.WORKSPACE_DELETED:
        // Workspace(tenant) is deleted
        await tenancy.doInTenant(tenantId, async () => {
          await tenantSdk.deleteTenant(tenantId)
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
