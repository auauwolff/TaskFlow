import { describe, expect, it } from 'vitest'
import {
  architectureViews,
  namesASourceFile,
  primaryViewOrder,
  sourceUrl,
  viewChildren,
  viewCounterfactual,
  type ArchitectureViewId,
} from './architectureModel'
import { getSourceCode } from './sourceCode'

/**
 * The explorer is hand-authored prose about a codebase that keeps moving, which is the exact
 * shape of documentation that rots silently: a renamed file leaves a dead GitHub link, a moved
 * declaration leaves a confident sentence describing code that is no longer there, and nothing
 * fails. These tests hold the parts of that claim a machine can check — that every path resolves,
 * every highlighted snippet still exists, and the graph is navigable — so the review left over is
 * the part that genuinely needs judgement: whether the description is still *true*.
 *
 * They deliberately do not assert the diagram matches the import graph. Dependency Cruiser already
 * enforces that, and a diagram is a teaching aid, not a second copy of the module graph.
 */

/**
 * Every path in the repository a node is allowed to name, keyed the same way the source panel keys
 * its own glob. Lazy: this is only ever asked which paths exist, so no file is read.
 *
 * Deliberately not `node:fs`. This file lives under `src`, whose tsconfig grants `vite/client` and
 * withholds node types on purpose — browser code has no business reaching for the file system, and
 * a test is not a reason to widen that. The glob answers the same question from inside the bundle.
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
    // Mirrors the mapping in sourceCode.ts, including its awkward middle case: Vite emits the
    // shortest relative path, so a sibling feature arrives as `../../session/index.ts` rather than
    // `../../../features/session/index.ts`.
    if (path.startsWith('../../../../../')) return path.slice('../../../../../'.length)
    if (path.startsWith('../../../')) return `frontend/src/${path.slice('../../../'.length)}`
    return `frontend/src/features/${path.slice('../../'.length)}`
  }),
)

const viewIds = Object.keys(architectureViews) as ArchitectureViewId[]
const allNodes = viewIds.flatMap((viewId) =>
  architectureViews[viewId].nodes.map((node) => ({ viewId, node })),
)

describe('architecture model source links', () => {
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

      // A node naming a file must resolve through the same glob the source panel reads, not merely
      // exist: the panel excludes tests and the architecture feature itself, so "the file is there"
      // is the weaker claim and would still let a node open with an empty code pane.
      expect(getSourceCode(sourcePath), `${sourcePath} is not readable by the source panel`)
        .toBeDefined()
    },
  )

  it('links directories to tree URLs and files to blob URLs', () => {
    // A .NET project directory is the case that breaks the obvious "does it contain a dot" test.
    expect(sourceUrl('backend/src/TaskFlow.Api')).toContain('/tree/main/')
    expect(sourceUrl('backend/src/TaskFlow.Api/Program.cs')).toContain('/blob/main/')
    expect(sourceUrl('frontend/src/shared/domain')).toContain('/tree/main/')
  })

  it.each(allNodes.filter(({ node }) => node.data.focus !== undefined))(
    '$viewId / $node.id highlights a snippet that is still in the file',
    ({ node }) => {
      const source = getSourceCode(node.data.sourcePath)
      expect(source, `${node.data.sourcePath} has a focus but no readable source`).toBeDefined()

      // indexOf, matching focusLines() in the explorer exactly. A snippet that no longer matches
      // does not throw at runtime, it silently highlights nothing - so this is the assertion that
      // keeps "look at these lines" pointing at the lines actually meant.
      expect(source!.indexOf(node.data.focus!), `snippet not found in ${node.data.sourcePath}`)
        .toBeGreaterThan(-1)
    },
  )
})

describe('architecture model graph integrity', () => {
  it.each(viewIds)('%s declares its own id', (viewId) => {
    expect(architectureViews[viewId].id).toBe(viewId)
  })

  it.each(viewIds)('%s has unique node and edge ids', (viewId) => {
    const view = architectureViews[viewId]
    const nodeIds = view.nodes.map((node) => node.id)
    const edgeIds = view.edges.map((edge) => edge.id)

    expect(new Set(nodeIds).size).toBe(nodeIds.length)
    expect(new Set(edgeIds).size).toBe(edgeIds.length)
  })

  it.each(viewIds)('%s only draws edges between nodes it contains', (viewId) => {
    const view = architectureViews[viewId]
    const nodeIds = new Set(view.nodes.map((node) => node.id))

    // React Flow drops an edge whose endpoint is missing without complaining, so a renamed node
    // quietly removes a relationship from the picture while the picture still looks complete.
    for (const edge of view.edges) {
      expect(nodeIds, `${viewId}: edge ${edge.id} has an unknown source`).toContain(edge.source)
      expect(nodeIds, `${viewId}: edge ${edge.id} has an unknown target`).toContain(edge.target)
    }
  })

  it('has no two nodes stacked at the same coordinates', () => {
    for (const viewId of viewIds) {
      const positions = architectureViews[viewId].nodes.map(({ position }) => `${position.x},${position.y}`)
      expect(new Set(positions).size, `${viewId} has overlapping nodes`).toBe(positions.length)
    }
  })
})

describe('architecture model navigation', () => {
  it('drills down only into views that exist', () => {
    for (const { viewId, node } of allNodes) {
      if (node.data.drilldown === undefined) continue
      expect(architectureViews, `${viewId} / ${node.id}`).toHaveProperty(node.data.drilldown)
    }
  })

  it('leaves no view unreachable', () => {
    const listedAsChild = new Set(Object.values(viewChildren).flat().map((child) => child.id))
    const drilldownTargets = new Set(allNodes.flatMap(({ node }) => node.data.drilldown ?? []))
    const toggleTargets = new Set(Object.values(viewCounterfactual).map((pair) => pair.id))

    for (const viewId of viewIds) {
      const reachable = primaryViewOrder.includes(viewId)
        || listedAsChild.has(viewId)
        || drilldownTargets.has(viewId)
        || toggleTargets.has(viewId)
      expect(reachable, `${viewId} has no way in`).toBe(true)
    }
  })

  it('pairs each counterfactual with the view it toggles back to', () => {
    for (const [viewId, pair] of Object.entries(viewCounterfactual)) {
      expect(architectureViews, `${viewId} toggles to a view that does not exist`).toHaveProperty(pair.id)
      // Asymmetry would strand a viewer in the counterfactual with no way back to the real thing.
      expect(viewCounterfactual[pair.id]?.id, `${pair.id} does not toggle back`).toBe(viewId)
    }
  })

  it('keeps the child tabs and the back button agreeing', () => {
    for (const [parentId, children] of Object.entries(viewChildren)) {
      for (const child of children) {
        expect(architectureViews[child.id].parent, `${child.id} is a tab under ${parentId}`)
          .toBe(parentId)
      }
    }
  })
})
