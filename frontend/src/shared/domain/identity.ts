import { guidIdentifier } from './identifier'

/**
 * The shared identity kernel: the vocabulary two or more features must agree on in order to talk
 * about the same thing, and which no single feature may redefine unilaterally.
 *
 * `Project.ownerId` is a `UserId` because a project genuinely belongs to a user. That fact is not
 * the session feature's private opinion, so `UserId` cannot live inside the session feature
 * without making projects — and then tasks — structurally depend on session in order to name it.
 *
 * The corollary is what stops a shared kernel becoming a junk drawer: **it holds vocabulary, never
 * behaviour.** Nothing here may import a transport, a store, or a feature.
 *
 * `TaskId` deliberately stays in `features/tasks/domain/task.ts`. No other feature needs to name a
 * task, so it remains tasks' own opinion — and that asymmetry is the rule made visible.
 */

declare const userIdBrand: unique symbol
declare const projectIdBrand: unique symbol

export type UserId = string & { readonly [userIdBrand]: true }
export type ProjectId = string & { readonly [projectIdBrand]: true }

export const userId = guidIdentifier<UserId>('user ID')
export const projectId = guidIdentifier<ProjectId>('project ID')
