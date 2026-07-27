import type { Edge, Node } from '@xyflow/react'

/**
 * The graph contract. Nothing in this folder knows what TaskFlow is: a host supplies a graph, a
 * source provider, and a lens, and gets an explorer.
 *
 * View ids are generic so a host can keep a literal union — which is what makes a typo in a
 * `drilldown` a compile error rather than a blank canvas — while a host that generates its graph
 * can fall back to plain `string`.
 */

export interface ExplorerNodeData extends Record<string, unknown> {
  label: string
  /** Free-form classification. Drives node colour (`.architecture-node--<kind>`) and the lens. */
  kind: string
  level: 'System' | 'Project' | 'Layer' | 'Module' | 'File'
  description: string
  technology: string
  responsibility: string
  /** Repository-relative path. A file the source panel can open, or a directory it summarises. */
  sourcePath?: string
  drilldown?: string
  /**
   * A distinctive code snippet locating the lines this node teaches. Resolved against the file's
   * source at render time (not stored line numbers), so ordinary edits elsewhere in the file
   * cannot silently point the highlight at the wrong code.
   */
  focus?: string
}

export interface ExplorerView<Id extends string = string> {
  id: Id
  label: string
  eyebrow: string
  title: string
  description: string
  parent?: Id
  /** Where this view sits in the lens when no node is selected. */
  lensKind?: string
  nodes: Node<ExplorerNodeData>[]
  edges: Edge[]
}

export interface ExplorerViewLink<Id extends string = string> {
  id: Id
  label: string
}

export interface ExplorerGraph<Id extends string = string> {
  /** The view opened first, and the one the breadcrumb trail stops at. */
  root: Id
  views: Record<Id, ExplorerView<Id>>
  /** Top-level entries in the sidebar, in order. */
  primary: Id[]
  /** Child tabs shown under a top-level view. Must agree with each child's `parent`. */
  children?: Partial<Record<Id, ExplorerViewLink<Id>[]>>
  /**
   * A view paired with the version of itself that deletes the thing it teaches. Symmetric: each
   * side names the other and carries its own button label.
   */
  counterfactual?: Partial<Record<Id, ExplorerViewLink<Id>>>
}

/**
 * The arrow vocabulary. Dependency inversion is a claim about two arrow systems pointing in
 * opposite directions, so edges carry semantics, not just labels:
 * - imports:    compile-time knowledge — one file may name types from another.
 * - implements: the inverted arrow — an outer adapter fulfilling a contract owned further in.
 * - registers:  composition wiring — a factory recorded under a token, no instance exists yet.
 * - runtime:    an instance or request flowing while the app runs (animated).
 * - forbidden:  the dependency the architecture exists to prevent.
 */
export type EdgeKind = 'imports' | 'implements' | 'registers' | 'runtime' | 'forbidden'

export function node(
  id: string,
  x: number,
  y: number,
  data: ExplorerNodeData,
): Node<ExplorerNodeData> {
  return { id, position: { x, y }, data, type: 'explorer' }
}

interface EdgeRouting {
  fromBelow?: boolean
  intoBelow?: boolean
}

export function edge(
  id: string,
  source: string,
  target: string,
  label: string,
  kind: EdgeKind = 'imports',
  routing: EdgeRouting = {},
): Edge {
  return {
    id,
    source,
    target,
    label,
    animated: kind === 'runtime' || kind === 'forbidden',
    type: 'smoothstep',
    className: `architecture-edge--${kind}`,
    sourceHandle: routing.fromBelow === true ? 'up' : undefined,
    targetHandle: routing.intoBelow === true ? 'down' : undefined,
  }
}

/** A node standing for one file, whose technology label is simply its filename. */
export function file(
  id: string,
  x: number,
  y: number,
  label: string,
  kind: string,
  sourcePath: string,
  description: string,
  responsibility: string,
  focus?: string,
): Node<ExplorerNodeData> {
  return node(id, x, y, {
    label,
    kind,
    level: 'File',
    technology: sourcePath.split('/').at(-1) ?? sourcePath,
    sourcePath,
    description,
    responsibility,
    focus,
  })
}

const sourceFileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.cs', '.css', '.json', '.md', '.props', '.txt', '.slnx', '.yml', '.yaml']

/**
 * Whether a source path names a file rather than a directory.
 *
 * Not "does the last segment contain a dot": `backend/src/TaskFlow.Api` is a directory, and .NET
 * names every project that way, so the dot test sends whole project folders to a file URL. An
 * extension allowlist is the boring answer and it is right.
 */
export function namesASourceFile(sourcePath: string) {
  return sourceFileExtensions.some((extension) => sourcePath.endsWith(extension))
}

/**
 * Structural problems a machine can find without reading the repository: broken navigation,
 * dangling edges, duplicate ids, stacked nodes. Returns one readable line per problem, so a host
 * test is a single assertion and any repository copying this folder gets the check for free.
 *
 * It deliberately says nothing about whether the graph *matches* the codebase — that needs the
 * source provider, and belongs in the host's own test.
 */
export function graphIssues<Id extends string>(graph: ExplorerGraph<Id>): string[] {
  const issues: string[] = []
  const viewIds = Object.keys(graph.views) as Id[]
  const has = (id: string) => Object.hasOwn(graph.views, id)

  if (!has(graph.root)) issues.push(`root view '${graph.root}' does not exist`)

  for (const viewId of viewIds) {
    const view = graph.views[viewId]
    if (view.id !== viewId) issues.push(`view '${viewId}' declares a different id: '${view.id}'`)

    if (view.parent !== undefined && !has(view.parent)) {
      issues.push(`view '${viewId}' has an unknown parent '${view.parent}'`)
    }

    const nodeIds = view.nodes.map((one) => one.id)
    const duplicateNodes = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index)
    for (const id of new Set(duplicateNodes)) issues.push(`view '${viewId}' has duplicate node id '${id}'`)

    const edgeIds = view.edges.map((one) => one.id)
    const duplicateEdges = edgeIds.filter((id, index) => edgeIds.indexOf(id) !== index)
    for (const id of new Set(duplicateEdges)) issues.push(`view '${viewId}' has duplicate edge id '${id}'`)

    // React Flow drops an edge whose endpoint is missing without complaining, so a renamed node
    // quietly removes a relationship from the picture while the picture still looks complete.
    const known = new Set(nodeIds)
    for (const one of view.edges) {
      if (!known.has(one.source)) issues.push(`view '${viewId}' edge '${one.id}' has an unknown source '${one.source}'`)
      if (!known.has(one.target)) issues.push(`view '${viewId}' edge '${one.id}' has an unknown target '${one.target}'`)
    }

    const positions = view.nodes.map(({ position }) => `${position.x},${position.y}`)
    const stacked = positions.filter((at, index) => positions.indexOf(at) !== index)
    for (const at of new Set(stacked)) issues.push(`view '${viewId}' stacks two nodes at ${at}`)

    for (const one of view.nodes) {
      const { drilldown } = one.data
      if (drilldown !== undefined && !has(drilldown)) {
        issues.push(`view '${viewId}' node '${one.id}' drills into unknown view '${drilldown}'`)
      }
    }
  }

  const reachable = new Set<string>([
    ...graph.primary,
    ...Object.values<ExplorerViewLink<Id>[] | undefined>(graph.children ?? {}).flatMap((links) => links ?? []).map((link) => link.id),
    ...Object.values<ExplorerViewLink<Id> | undefined>(graph.counterfactual ?? {}).map((link) => link?.id ?? ''),
    ...viewIds.flatMap((viewId) => graph.views[viewId].nodes.flatMap((one) => one.data.drilldown ?? [])),
  ])
  for (const viewId of viewIds) {
    if (!reachable.has(viewId)) issues.push(`view '${viewId}' has no way in`)
  }

  for (const [parentId, links] of Object.entries<ExplorerViewLink<Id>[] | undefined>(graph.children ?? {})) {
    for (const link of links ?? []) {
      if (!has(link.id)) issues.push(`'${parentId}' lists a child view that does not exist: '${link.id}'`)
      else if (graph.views[link.id].parent !== parentId) {
        issues.push(`'${link.id}' is a tab under '${parentId}' but its parent is '${String(graph.views[link.id].parent)}'`)
      }
    }
  }

  // Asymmetry would strand a viewer in the counterfactual with no way back to the real thing.
  for (const [viewId, link] of Object.entries<ExplorerViewLink<Id> | undefined>(graph.counterfactual ?? {})) {
    if (link === undefined) continue
    if (!has(link.id)) issues.push(`'${viewId}' toggles to a view that does not exist: '${link.id}'`)
    else if (graph.counterfactual?.[link.id]?.id !== viewId) issues.push(`'${link.id}' does not toggle back to '${viewId}'`)
  }

  return issues
}
