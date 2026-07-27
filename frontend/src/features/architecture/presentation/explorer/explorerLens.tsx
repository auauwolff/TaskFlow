import type { ReactNode } from 'react'

/**
 * A lens is the architecture vocabulary the explorer is describing positions in.
 *
 * The renderer is a graph navigator and knows nothing about layers, ports, or dependency
 * direction. Everything that assumes a *particular* architecture lives behind this contract, so a
 * repository organised by feature, by service, or by nothing in particular can supply its own —
 * or none at all — without the canvas changing.
 */

export interface ExplorerLensContext {
  /** The selected node's kind, or the current view's `lensKind` when nothing is selected. */
  activeKind: string | undefined
  /** Breadcrumb trail from the root view to the selection. */
  path: string[]
}

export interface LegendEntry {
  /** Class applied to the swatch, so the lens and the stylesheet agree on colour. */
  className: string
  label: string
}

export interface ExplorerLens {
  id: string
  nodeLegend?: { title: string; entries: LegendEntry[] }
  edgeLegend?: { title: string; entries: LegendEntry[] }
  /** An orientation panel: where in the architecture am I standing? */
  compass?: (context: ExplorerLensContext) => ReactNode
}

const outerKinds = new Set(['Presentation', 'Composition', 'Adapter', 'Token'])

/**
 * Clean / Hexagonal Architecture: concentric rings with the domain at the centre and every arrow
 * pointing inward. Replaces a geometric minimap with a map of the *architecture* rather than of
 * the canvas, so a viewer always knows which ring they are in.
 */
export const cleanArchitectureLens: ExplorerLens = {
  id: 'clean-architecture',

  nodeLegend: {
    title: 'Layer key',
    entries: [
      { className: 'legend-domain', label: 'Domain' },
      { className: 'legend-application', label: 'Application' },
      { className: 'legend-adapter', label: 'Adapter / edge' },
      { className: 'legend-state', label: 'State / data' },
      { className: 'legend-token', label: 'DI token' },
    ],
  },

  edgeLegend: {
    title: 'Arrow key',
    entries: [
      { className: 'legend-edge legend-edge--imports', label: 'Imports / uses' },
      { className: 'legend-edge legend-edge--implements', label: 'Implements (inverted)' },
      { className: 'legend-edge legend-edge--registers', label: 'DI registration' },
      { className: 'legend-edge legend-edge--runtime', label: 'Runtime flow' },
    ],
  },

  compass: ({ activeKind, path }) => (
    <aside className="architecture-compass" aria-label="Current architecture position">
      <div className="architecture-compass__heading">
        <span>Architecture position</span>
        <strong>{path.join(' / ')}</strong>
      </div>
      <div className="architecture-compass__map">
        <span className={`architecture-compass__system architecture-compass__system--data${activeKind === 'Data' || activeKind === 'State' ? ' is-active' : ''}`}>Data</span>
        <span className={`architecture-compass__system architecture-compass__system--external${activeKind === 'External' ? ' is-active' : ''}`}>External</span>
        <div className={`architecture-compass__ring architecture-compass__ring--outer${activeKind !== undefined && outerKinds.has(activeKind) ? ' is-active' : ''}`}>
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
  ),
}
