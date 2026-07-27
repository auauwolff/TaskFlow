# explorer — a portable codebase explorer

A hierarchical graph navigator for a codebase: drill from systems to projects, layers, modules and
files, isolate a node's dependency neighbourhood, and read the source without leaving the graph.

Nothing in this folder knows what TaskFlow is. Copy it into another repository, write one graph, and
you have an explorer for that repository.

## Using it

```tsx
<ArchitectureExplorer
  graph={myGraph}
  source={mySourceProvider}
  lens={cleanArchitectureLens}   // optional
  heading={{ kicker: 'Acme / Architecture', title: 'System explorer', intro: '...' }}
/>
```

Three things are yours to supply.

**The graph** (`explorerGraph.ts`) is the content: views, nodes, edges, and the prose explaining why
each node earns its place. Build it with the `node()`, `edge()` and `file()` helpers. View ids are
generic, so a literal union turns a typo in a `drilldown` into a compile error rather than a blank
canvas. See TaskFlow's `../architectureModel.ts` for a worked example.

**The source provider** (`sourceProvider.ts`) decides how files are reached, because that is a
property of the repository and its build rather than of the viewer. `read` is async so a host can
load on demand — a lazy bundler glob, a generated manifest, a dev-server endpoint, or a
source-control API. Resist the eager `?raw` glob: it inlines every matched file into the bundle,
which is linear in repository size and ships private source in a public artifact by default.

**The lens** (`explorerLens.tsx`) is the architecture vocabulary — the legends and the orientation
compass. `cleanArchitectureLens` draws concentric rings with the domain at the centre. A repository
organised by service, by feature, or by nothing in particular supplies its own lens, or omits it:
the canvas works without one.

## Keeping the graph honest

A curated diagram of a moving codebase rots silently — a renamed file leaves a dead link, a moved
declaration leaves a confident sentence about code that is gone, and nothing fails.

`graphIssues(graph)` returns one readable line per structural problem: duplicate ids, edges pointing
at nodes that do not exist, views with no way in, child tabs that disagree with their parent,
stacked nodes. One assertion in a test covers all of it.

```ts
expect(graphIssues(myGraph)).toEqual([])
```

It deliberately says nothing about whether the graph matches the codebase, because that needs the
source provider. TaskFlow's `../architectureModel.test.ts` shows the other half: every `sourcePath`
resolves, and every `focus` snippet is still present in the file it highlights. Highlights are
anchored by code snippet rather than line number precisely so drift breaks the suite instead of
quietly pointing at the wrong lines.

What no test can check is whether a node's prose is still *true*. That is the part to reread when a
boundary moves — and it is also the part that makes the tool worth having, since static analysis can
produce nodes and edges but never the reason a node exists.

## Styling

`ArchitectureExplorer.css` owns the whole surface and expects a dark shell. Node colour comes from
`.architecture-node--<kind>` where `<kind>` is the lowercased node `kind`, so a new vocabulary means
adding classes there and matching `className` values in the lens legends.
