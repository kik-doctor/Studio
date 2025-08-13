import { Header } from "../constants"
import { buildMatcherRegex, matches } from "./matchers"
import env from "../environment"
import { Ctx, EndpointMatcher } from "@budibase/types"
import type { Middleware, Next } from "koa"

function getHeader(ctx: Ctx, header: Header): string | undefined {
  const contents = ctx.request.headers[header]
  if (Array.isArray(contents)) {
    throw new Error("Unexpected header format")
  }
  return contents
}

export function webhook(
  webhookPatterns: EndpointMatcher[] = [],
) {
  const webhookOptions = webhookPatterns ? buildMatcherRegex(webhookPatterns) : []
  return (async (ctx: Ctx, next: Next) => {
    const found = matches(ctx, webhookOptions)
    let headerKey = getHeader(ctx, Header.WEBHOOK_KEY)

    if (found && headerKey !== env.WEBHOOK_AUTH_KEY) {
      ctx.throw(401, 'Unauthorized: Invalid webhook key')
    }
    return next()
  }) as Middleware
}
