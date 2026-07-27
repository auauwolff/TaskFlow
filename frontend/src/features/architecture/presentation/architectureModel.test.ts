import { describe, expect, it } from 'vitest'
import { taskflowGraph } from './architectureModel'
import { graphIssues, namesASourceFile } from './explorer/explorerGraph'
import { gitHubSourceUrl } from './explorer/sourceProvider'
import { readableSourcePaths, taskflowSource } from './taskflowSource'

/**
 * The explorer is hand-authored prose about a codebase that keeps moving, which is the exact shape
 * of documentation that rots silently: a renamed file leaves a dead link, a moved declaration
 * leaves a confident sentence describing code that is no longer there, and nothing fails.
 *
 * The structural half is checked by `graphIssues`, which ships with the explorer so any repository
 * copying that folder inherits it. This file adds the half that needs *this* repository: that every
 * path resolves and every highlighted snippet is still where the model says it is.
 *
 * What no test can check is whether a node's prose is still *true*. That is the part to reread when
 * a boundary moves.
 */

const allNodes = Object.values(taskflowGraph.views).flatMap((view) =>
  view.nodes.map((node) => ({ viewId: view.id, node })),
)

/**
 * Every path in the repository a node is allowed to name. Lazy — this is only ever asked which
 * paths exist, so no file is read.
 *
 * Deliberately not `node:fs`. This file lives under `src`, whose tsconfig grants `vite/client` and
 * withholds node types on purpose: browser code has no business reaching for the file system, and
 * a test is not a reason to widen that.
 */
const repositoryPaths = new Set(
  Object.keys({
    ...import.meta.glob(['../../../**/*'], { eager: false }),
    ...import.meta.glob([
      '../../../../../backend/**/*.{cs,csproj,slnx,props,txt,json}',
      '../../../../../infra/**/*',
      '!**/bin/**',
      '!**/obj/**',
    ], { eager: false }),
  }).map((path) => {
    if (path.startsWith('../../../../../')) return path.slice('../../../../../'.length)
    if (path.startsWith('../../../')) return `frontend/src/${path.slice('../../../'.length)}`
    return `frontend/src/features/${path.slice('../../'.length)}`
  }),
)

describe('taskflow architecture graph', () => {
  it('is structurally sound', () => {
    // One assertion covering ids, edge endpoints, stacked nodes, drilldowns, reachability, and the
    // agreement between child tabs and back buttons. Any failure names itself.
    expect(graphIssues(taskflowGraph)).toEqual([])
  })

  it.each(allNodes.filter(({ node }) => node.data.sourcePath !== undefined))(
    '$viewId / $node.id points at something that exists',
    ({ node }) => {
      const sourcePath = node.data.sourcePath!

      if (!namesASourceFile(sourcePath)) {
        // A node summarising a module names a directory, which is only real if the repository has
        // something inside it.
        const populated = [...repositoryPaths].some((path) => path.startsWith(`${sourcePath}/`))
        expect(populated, `${sourcePath} is not a directory with anything in it`).toBe(true)
        return
      }

      // A node naming a file must be reachable through the provider the source panel uses, not
      // merely exist: the provider excludes tests and the explorer itself, so "the file is there"
      // is the weaker claim and would still let a node open with an empty code pane.
      expect(readableSourcePaths, `${sourcePath} is not readable by the source panel`)
        .toContain(sourcePath)
    },
  )

  it.each(allNodes.filter(({ node }) => node.data.focus !== undefined))(
    '$viewId / $node.id highlights a snippet that is still in the file',
    async ({ node }) => {
      const source = await taskflowSource.read(node.data.sourcePath!)
      expect(source, `${node.data.sourcePath} has a focus but no readable source`).toBeDefined()

      // indexOf, matching focusLines() in the explorer exactly. A snippet that no longer matches
      // does not throw at runtime, it silently highlights nothing - so this is the assertion that
      // keeps "look at these lines" pointing at the lines actually meant.
      expect(source!.indexOf(node.data.focus!), `snippet not found in ${node.data.sourcePath}`)
        .toBeGreaterThan(-1)
    },
  )

  it('links directories to tree URLs and files to blob URLs', () => {
    // A .NET project directory is the case that breaks the obvious "does it contain a dot" test.
    expect(taskflowSource.urlFor('backend/src/TaskFlow.Api')).toContain('/tree/main/')
    expect(taskflowSource.urlFor('backend/src/TaskFlow.Api/Program.cs')).toContain('/blob/main/')
    expect(taskflowSource.urlFor('frontend/src/shared/domain')).toContain('/tree/main/')
  })

  it('builds repository URLs without a doubled slash', () => {
    const url = gitHubSourceUrl('https://example.com/org/repo/', 'trunk')

    expect(url('src/main.ts')).toBe('https://example.com/org/repo/blob/trunk/src/main.ts')
  })
})
