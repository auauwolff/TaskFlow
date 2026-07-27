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
import {
  architectureViews,
  primaryViewOrder,
  sourceUrl,
  viewChildren,
  viewCounterfactual,
  type ArchitectureNodeData,
  type ArchitectureView,
  type ArchitectureViewId,
} from './architectureModel'
import { getSourceCode } from './sourceCode'

function ArchitectureNode({ data, selected }: NodeProps) {
  const architectureData = data as ArchitectureNodeData

  return (
    <div className={`architecture-node architecture-node--${architectureData.kind.toLowerCase()}${selected ? ' is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      {/* Vertical handles let a view route its runtime arrows on a different axis than its
          compile-time arrows — the DI inversion lens depends on the two systems reading as
          visually opposed rather than tangled. */}
      <Handle type="target" position={Position.Bottom} id="down" />
      <div className="architecture-node__meta">
        <span>{architectureData.level} / {architectureData.kind}</span>
        <span className="architecture-node__mark">{architectureData.kind.slice(0, 2).toUpperCase()}</span>
      </div>
      <strong>{architectureData.label}</strong>
      <small>{architectureData.technology}</small>
      {architectureData.drilldown === undefined ? null : <span className="architecture-node__drill">Explore contents</span>}
      <Handle type="source" position={Position.Right} />
      <Handle type="source" position={Position.Top} id="up" />
    </div>
  )
}

const nodeTypes = { architecture: ArchitectureNode }

const viewKinds: Partial<Record<ArchitectureViewId, string>> = {
  'frontend-nutshell': 'Application',
  'frontend-composition': 'Composition',
  'frontend-session': 'Application',
  'frontend-projects': 'Application',
  'frontend-tasks': 'Application',
  'backend-api': 'Presentation',
  'backend-application': 'Application',
  'backend-domain': 'Domain',
  'backend-infrastructure': 'Adapter',
  'di-inversion': 'Composition',
  'di-inversion-without': 'Presentation',
}

function viewPath(viewId: ArchitectureViewId) {
  const path: string[] = []
  let current: ArchitectureView | undefined = architectureViews[viewId]

  while (current !== undefined) {
    path.unshift(current.label)
    current = current.parent === undefined ? undefined : architectureViews[current.parent]
  }

  return path
}

function ArchitectureCompass({ viewId, selectedNode }: {
  viewId: ArchitectureViewId
  selectedNode: Node<ArchitectureNodeData> | null
}) {
  const activeKind = selectedNode?.data.kind ?? viewKinds[viewId]
  const path = [...viewPath(viewId), ...(selectedNode === null ? [] : [selectedNode.data.label])]
  const isOuterEdge = activeKind === 'Presentation' || activeKind === 'Composition' || activeKind === 'Adapter' || activeKind === 'Token'

  return (
    <aside className="architecture-compass" aria-label="Current architecture position">
      <div className="architecture-compass__heading">
        <span>Architecture position</span>
        <strong>{path.join(' / ')}</strong>
      </div>
      <div className="architecture-compass__map">
        <span className={`architecture-compass__system architecture-compass__system--data${activeKind === 'Data' || activeKind === 'State' ? ' is-active' : ''}`}>Data</span>
        <span className={`architecture-compass__system architecture-compass__system--external${activeKind === 'External' ? ' is-active' : ''}`}>External</span>
        <div className={`architecture-compass__ring architecture-compass__ring--outer${isOuterEdge ? ' is-active' : ''}`}>
          <span className={activeKind === 'Presentation' ? 'is-active' : ''}>Presentation</span>
          <span className={activeKind === 'Composition' ? 'is-active' : ''}>Composition</span>
          <span className={activeKind === 'Adapter' ? 'is-active' : ''}>Adapters</span>
          <div className={`architecture-compass__ring architecture-compass__ring--application${activeKind === 'Application' ? ' is-active' : ''}`}>
            <span>Application / ports</span>
            <div className={`architecture-compass__ring architecture-compass__ring--domain${activeKind === 'Domain' ? ' is-active' : ''}`}>
              <strong>Domain</strong>
            </div>
          </div>
        </div>
        <div className="architecture-compass__direction">Dependencies point inward</div>
      </div>
    </aside>
  )
}

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

function SourceViewer({ source, sourcePath, focus }: { source: string; sourcePath: string; focus?: string }) {
  const [highlightedSource, setHighlightedSource] = useState<string>()
  const frameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    void import('./sourceHighlighter')
      .then(({ highlightSource }) => highlightSource(source, sourcePath, focusLines(source, focus)))
      .then((html) => {
        if (active) setHighlightedSource(html)
      })

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
        ? <div className="architecture-source__loading">Loading syntax highlighting...</div>
        : <div className="architecture-source__frame" ref={frameRef} dangerouslySetInnerHTML={{ __html: highlightedSource }} />}
    </section>
  )
}

function topLevelViewId(viewId: ArchitectureViewId) {
  let current = architectureViews[viewId]

  while (current.parent !== undefined && current.parent !== 'overview') {
    current = architectureViews[current.parent]
  }

  return current.id
}

export function ArchitectureExplorer() {
  const isCompact = window.matchMedia('(max-width: 800px)').matches
  const [viewId, setViewId] = useState<ArchitectureViewId>('overview')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const view = architectureViews[viewId]
  const [layoutNodes, setLayoutNodes, onNodesChange] = useNodesState(view.nodes)
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<Node<ArchitectureNodeData>>>()
  const activeTopLevelViewId = topLevelViewId(viewId)
  const counterfactual = viewCounterfactual[viewId]
  // You are standing in the counterfactual when the view it toggles to is also the view you came
  // from - which is only true of the "without" side of the pair.
  const isCounterfactual = counterfactual !== undefined && view.parent === counterfactual.id
  const selectedNode = view.nodes.find((node) => node.id === selectedId) ?? null
  const selectedSourcePath = selectedNode?.data.sourcePath
  const selectedSource = getSourceCode(selectedSourcePath)
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

  function openView(nextView: ArchitectureViewId) {
    setViewId(nextView)
    setSelectedId(null)
    setLayoutNodes(architectureViews[nextView].nodes)
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

  return (
    <main className="architecture-explorer">
      <aside className="architecture-sidebar">
        <div>
          <p className="architecture-kicker">TaskFlow / Architecture</p>
          <h1>System explorer</h1>
          <p className="architecture-intro">Navigate from deployable systems to layers, modules, dependency injection, and concrete files.</p>
        </div>

        <nav className="architecture-nav" aria-label="Architecture views">
          {primaryViewOrder.map((id, index) => {
            const children = viewChildren[id]
            const isActiveBranch = id === activeTopLevelViewId

            return (
              <div className="architecture-nav__branch" key={id}>
                <button className={isActiveBranch ? 'is-active' : ''} type="button" onClick={() => openView(id)}>
                  <span>0{index + 1}</span>
                  {architectureViews[id].label}
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

        <div className="architecture-legend">
          <p>Layer key</p>
          <div><i className="legend-domain" />Domain</div>
          <div><i className="legend-application" />Application</div>
          <div><i className="legend-adapter" />Adapter / edge</div>
          <div><i className="legend-state" />State / data</div>
          <div><i className="legend-token" />DI token</div>
        </div>

        <div className="architecture-legend architecture-legend--edges">
          <p>Arrow key</p>
          <div><i className="legend-edge legend-edge--imports" />Imports / uses</div>
          <div><i className="legend-edge legend-edge--implements" />Implements (inverted)</div>
          <div><i className="legend-edge legend-edge--registers" />DI registration</div>
          <div><i className="legend-edge legend-edge--runtime" />Runtime flow</div>
        </div>
      </aside>

      <section className="architecture-stage">
        <header className="architecture-toolbar">
          {view.parent === undefined
            ? <span className="architecture-breadcrumb">{view.label}</span>
            : (
              <button className="architecture-back" type="button" onClick={() => openView(view.parent!)}>
                &lt;- {architectureViews[view.parent].label}
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
              const drilldown = node.data.drilldown as ArchitectureViewId | undefined
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

          <ArchitectureCompass viewId={viewId} selectedNode={selectedNode} />

          {selectedNode === null ? null : (
            <aside className={`architecture-inspector${selectedSource === undefined ? '' : ' architecture-inspector--source'}`}>
              <button className="architecture-inspector__close" type="button" aria-label="Close details" onClick={() => setSelectedId(null)}>x</button>
              <p>{selectedNode.data.kind}</p>
              <h3>{selectedNode.data.label}</h3>
              <span className="architecture-inspector__tech">{selectedNode.data.level} / {selectedNode.data.technology}</span>
              {selectedNode.data.sourcePath === undefined
                ? null
                : <code className="architecture-inspector__path">{selectedNode.data.sourcePath}</code>}
              {selectedSource === undefined || selectedSourcePath === undefined
                ? null
                : <SourceViewer key={selectedSourcePath} source={selectedSource} sourcePath={selectedSourcePath} focus={selectedNode.data.focus} />}
              {selectedNode.data.drilldown === undefined ? null : (
                <button className="architecture-inspector__primary" type="button" onClick={() => openView(selectedNode.data.drilldown!)}>
                  Explore {selectedNode.data.label}
                </button>
              )}
              {selectedNode.data.sourcePath === undefined ? null : (
                <a href={sourceUrl(selectedNode.data.sourcePath)} target="_blank" rel="noreferrer">Open on GitHub <span>-&gt;</span></a>
              )}
            </aside>
          )}
        </div>
      </section>
    </main>
  )
}
