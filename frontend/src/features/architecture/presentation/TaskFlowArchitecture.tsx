import { taskflowGraph } from './architectureModel'
import { ArchitectureExplorer } from './explorer/ArchitectureExplorer'
import { cleanArchitectureLens } from './explorer/explorerLens'
import { taskflowSource } from './taskflowSource'

/**
 * Binds the portable explorer to this repository: TaskFlow's graph, TaskFlow's files, and the Clean
 * Architecture lens. This composition is the whole integration — three imports and a heading.
 */
export function TaskFlowArchitecture() {
  return (
    <ArchitectureExplorer
      graph={taskflowGraph}
      source={taskflowSource}
      lens={cleanArchitectureLens}
      heading={{
        kicker: 'TaskFlow / Architecture',
        title: 'System explorer',
        intro: 'Navigate from deployable systems to layers, modules, dependency injection, and concrete files.',
      }}
    />
  )
}
