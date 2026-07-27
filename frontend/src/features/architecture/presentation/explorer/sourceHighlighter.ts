import { createHighlighterCore } from '@shikijs/core'
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript'
import csharp from '@shikijs/langs/csharp'
import tsx from '@shikijs/langs/tsx'
import typescript from '@shikijs/langs/typescript'
import darkPlus from '@shikijs/themes/dark-plus'

const highlighter = createHighlighterCore({
  engine: createJavaScriptRegexEngine(),
  langs: [csharp, tsx, typescript],
  themes: [darkPlus],
})

export async function highlightSource(source: string, sourcePath: string, focus?: [number, number]) {
  const language = sourcePath.endsWith('.cs') ? 'csharp' : sourcePath.endsWith('.tsx') ? 'tsx' : 'typescript'

  return (await highlighter).codeToHtml(source, {
    lang: language,
    theme: 'dark-plus',
    transformers: focus === undefined
      ? []
      : [{
          line(node, line) {
            if (line >= focus[0] && line <= focus[1]) this.addClassToHast(node, 'line-focus')
          },
        }],
  })
}
