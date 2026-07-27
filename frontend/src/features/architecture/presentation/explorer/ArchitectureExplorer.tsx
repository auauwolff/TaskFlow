import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  useNodesState,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from '@xyflow/react'
import { useEffect, useRef, useState } from 'react'
import '@xyflow/react/dist/style.css'
import './ArchitectureExplorer.css'
import type { ExplorerGraph, ExplorerNodeData, ExplorerView } from './explorerGraph'
import type { ExplorerLens } from './explorerLens'
import type { SourceProvider } from './sourceProvider'

/**
 * A hierarchical codebase explorer: navigate from systems to projects, layers, modules, and files,
 * isolate a node's dependency neighbourhood, and read the source without leaving the graph.
 *
 * Everything specific to a repository arrives as props. The graph is the content, the
 * {@link SourceProvider} decides how files are reached, and the {@link ExplorerLens} supplies the
 * architecture vocabulary. Copy this folder into another repository and the only file you write is
 * the graph.
 */

function ExplorerNode({ data, selected }: NodeProps) {
  const nodeData = data as ExplorerNodeData

  return (
    <div className={`architecture-node architecture-node--${nodeData.kind.toLowerCase()}${selected ? ' is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      {/* Vertical handles let a view route its runtime arrows on a different axis than its
          compile-time arrows — a dependency-inversion lens depends on the two systems reading as
          visually opposed rather than tangled. */}
      <Handle type="target" position={Position.Bottom} id="down" />
      <div className="architecture-node__meta">
        <span>{nodeData.level} / {nodeData.kind}</span>
        <span className="architecture-node__mark">{nodeData.kind.slice(0, 2).toUpperCase()}</span>
      </div>
      <strong>{nodeData.label}</strong>
      <small>{nodeData.technology}</small>
      {nodeData.drilldown === undefined ? null : <span className="architecture-node__drill">Explore contents</span>}
      <Handle type="source" position={Position.Right} />
      <Handle type="source" position={Position.Top} id="up" />
    </div>
  )
}

const nodeTypes = { explorer: ExplorerNode }

// The focus anchor is a code snippet, not stored line numbers: the range is resolved against the
// current source on every render, so edits elsewhere in a file can never silently shift the
// highlight onto the wrong code. An anchor that no longer matches simply highlights nothing.
function focusLines(source: string, focus: string | undefined): [number, number] | undefined {
  if (focus === undefined) return undefined
  const index = source.indexOf(focus)
  if (index < 0) return undefined

  const firstLine = source.slice(0, index).split('\n').length
  return [firstLine, firstLine + focus.split('\n').length - 1]
}

function SourceViewer({ sourcePath, focus, source }: {
  sourcePath: string
  focus?: string
  source: SourceProvider
}) {
  const [highlightedSource, setHighlightedSource] = useState<string>()
  const frameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    setHighlightedSource(undefined)

    // Reading and highlighting are both deferred: the provider may fetch, and the highlighter is a
    // large dependency that has no business in the initial chunk.
    void (async () => {
      const text = await source.read(sourcePath)
      if (!active || text === undefined) return

      const { highlightSource } = await import('./sourceHighlighter')
      const html = await highlightSource(text, sourcePath, focusLines(text, focus))
      if (active) setHighlightedSource(html)
    })()

    return () => { active = false }
  }, [source, sourcePath, focus])

  useEffect(() => {
    if (highlightedSource === undefined) return

    frameRef.current
      ?.querySelector('.line-focus')
      ?.scrollIntoView({ block: 'center' })
  }, [highlightedSource])

  return (
    <section className="architecture-source" aria-label="Source code">
      {highlightedSource === undefined
        ? <div className="architecture-source__loading">Loading source...</div>
        : <div className="architecture-source__frame" ref={frameRef} dangerouslySetInnerHTML={{ __html: highlightedSource }} />}
    </section>
  )
}

export interface ArchitectureExplorerProps<Id extends string = string> {
  graph: ExplorerGraph<Id>
  source: SourceProvider
  lens?: ExplorerLens
  heading: { kicker: string; title: string; intro: string }
}

export function ArchitectureExplorer<Id extends string = string>({
  graph,
  source,
  lens,
  heading,
}: ArchitectureExplorerProps<Id>) {
  const isCompact = window.matchMedia('(max-width: 800px)').matches
  const [viewId, setViewId] = useState<Id>(graph.root)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const view = graph.views[viewId]
  const [layoutNodes, setLayoutNodes, onNodesChange] = useNodesState(view.nodes)
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<Node<ExplorerNodeData>>>()
  const counterfactual = graph.counterfactual?.[viewId]
  // You are standing in the counterfactual when the view it toggles to is also the view you came
  // from - which is only true of the "without" side of the pair.
  const isCounterfactual = counterfactual !== undefined && view.parent === counterfactual.id
  const selectedNode = view.nodes.find((node) => node.id === selectedId) ?? null
  const selectedSourcePath = selectedNode?.data.sourcePath
  const connectedIds = selectedId === null
    ? null
    : new Set([
        selectedId,
        ...view.edges.flatMap((edge) => {
          if (edge.source === selectedId) return [edge.target]
          if (edge.target === selectedId) return [edge.source]
          return []
        }),
      ])
  const nodes = layoutNodes.map((node) => ({
    ...node,
    selected: node.id === selectedId,
    className: connectedIds !== null && !connectedIds.has(node.id) ? 'is-dimmed' : '',
  }))
  const edges = view.edges.map((edge) => ({
    ...edge,
    className: [
      edge.className ?? '',
      selectedId !== null && edge.source !== selectedId && edge.target !== selectedId ? 'is-dimmed' : '',
    ].join(' ').trim(),
  }))

  function topLevelViewId(id: Id) {
    let current = graph.views[id]

    while (current.parent !== undefined && current.parent !== graph.root) {
      current = graph.views[current.parent]
    }

    return current.id
  }

  function viewPath(id: Id) {
    const path: string[] = []
    let current: ExplorerView<Id> | undefined = graph.views[id]

    while (current !== undefined) {
      path.unshift(current.label)
      current = current.parent === undefined ? undefined : graph.views[current.parent]
    }

    return path
  }

  function openView(nextView: Id) {
    setViewId(nextView)
    setSelectedId(null)
    setLayoutNodes(graph.views[nextView].nodes)
  }

  function resetLayout() {
    setLayoutNodes(view.nodes.map((node) => ({ ...node, position: { ...node.position } })))
    setSelectedId(null)

    requestAnimationFrame(() => {
      if (isCompact) {
        void flowInstance?.setViewport({ x: 35, y: 110, zoom: 0.62 }, { duration: 300 })
      } else {
        void flowInstance?.fitView({ padding: 0.2, maxZoom: 1, duration: 300 })
      }
    })
  }

  const activeTopLevelViewId = topLevelViewId(viewId)
  const externalUrl = selectedSourcePath === undefined ? undefined : source.urlFor(selectedSourcePath)

  return (
    <main className="architecture-explorer">
      <aside className="architecture-sidebar">
        <div>
          <p className="architecture-kicker">{heading.kicker}</p>
          <h1>{heading.title}</h1>
          <p className="architecture-intro">{heading.intro}</p>
        </div>

        <nav className="architecture-nav" aria-label="Architecture views">
          {graph.primary.map((id, index) => {
            const children = graph.children?.[id]
            const isActiveBranch = id === activeTopLevelViewId

            return (
              <div className="architecture-nav__branch" key={id}>
                <button className={isActiveBranch ? 'is-active' : ''} type="button" onClick={() => openView(id)}>
                  <span>0{index + 1}</span>
                  {graph.views[id].label}
                </button>
                {!isActiveBranch || children === undefined ? null : (
                  <div className="architecture-nav__children">
                    {children.map((child) => (
                      <button
                        className={child.id === viewId ? 'is-active' : ''}
                        type="button"
                        key={child.id}
                        onClick={() => openView(child.id)}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {lens?.nodeLegend === undefined ? null : (
          <div className="architecture-legend">
            <p>{lens.nodeLegend.title}</p>
            {lens.nodeLegend.entries.map((entry) => (
              <div key={entry.label}><i className={entry.className} />{entry.label}</div>
            ))}
          </div>
        )}

        {lens?.edgeLegend === undefined ? null : (
          <div className="architecture-legend architecture-legend--edges">
            <p>{lens.edgeLegend.title}</p>
            {lens.edgeLegend.entries.map((entry) => (
              <div key={entry.label}><i className={entry.className} />{entry.label}</div>
            ))}
          </div>
        )}
      </aside>

      <section className="architecture-stage">
        <header className="architecture-toolbar">
          {view.parent === undefined
            ? <span className="architecture-breadcrumb">{view.label}</span>
            : (
              <button className="architecture-back" type="button" onClick={() => openView(view.parent!)}>
                &lt;- {graph.views[view.parent].label}
              </button>
            )}
          <div className="architecture-viewheader">
            <p>{view.eyebrow}</p>
            <strong>{view.title}</strong>
            <span>{view.description}</span>
          </div>
        </header>

        <div className="architecture-canvas">
          <ReactFlow
            key={viewId}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onInit={setFlowInstance}
            onNodesChange={onNodesChange}
            fitView={!isCompact}
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            defaultViewport={isCompact ? { x: 35, y: 110, zoom: 0.62 } : undefined}
            minZoom={0.25}
            maxZoom={1.8}
            nodesDraggable
            onPaneClick={() => setSelectedId(null)}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onNodeDoubleClick={(_, node) => {
              const drilldown = node.data.drilldown as Id | undefined
              if (drilldown !== undefined) openView(drilldown)
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#2b302d" gap={28} size={1} />
            <Controls showInteractive={false} position="top-right" />
          </ReactFlow>

          <div className="architecture-canvas__actions">
            <div className="architecture-hint">Drag to arrange / Click for dependencies / Double-click to explore</div>
            <button className="architecture-reset" type="button" onClick={resetLayout}>Reset layout</button>
            {counterfactual === undefined ? null : (
              <button
                className={`architecture-reset architecture-counterfactual${isCounterfactual ? ' is-active' : ''}`}
                type="button"
                onClick={() => openView(counterfactual.id)}
              >
                {counterfactual.label}
              </button>
            )}
          </div>

          {lens?.compass?.({
            activeKind: selectedNode?.data.kind ?? view.lensKind,
            path: [...viewPath(viewId), ...(selectedNode === null ? [] : [selectedNode.data.label])],
          })}

          {selectedNode === null ? null : (
            <aside className={`architecture-inspector${selectedSourcePath === undefined ? '' : ' architecture-inspector--source'}`}>
              <button className="architecture-inspector__close" type="button" aria-label="Close details" onClick={() => setSelectedId(null)}>x</button>
              <p>{selectedNode.data.kind}</p>
              <h3>{selectedNode.data.label}</h3>
              <span className="architecture-inspector__tech">{selectedNode.data.level} / {selectedNode.data.technology}</span>
              {selectedSourcePath === undefined
                ? null
                : <code className="architecture-inspector__path">{selectedSourcePath}</code>}
              {selectedSourcePath === undefined
                ? null
                : <SourceViewer key={selectedSourcePath} sourcePath={selectedSourcePath} focus={selectedNode.data.focus} source={source} />}
              {selectedNode.data.drilldown === undefined ? null : (
                <button className="architecture-inspector__primary" type="button" onClick={() => openView(selectedNode.data.drilldown as Id)}>
                  Explore {selectedNode.data.label}
                </button>
              )}
              {externalUrl === undefined ? null : (
                <a href={externalUrl} target="_blank" rel="noreferrer">Open on GitHub <span>-&gt;</span></a>
              )}
            </aside>
          )}
        </div>
      </section>
    </main>
  )
}
