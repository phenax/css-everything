import { Dependencies, evalExpr } from './eval'
import { parse } from './parser'

const UNSET_PROPERTY_VALUE = '<unset>'
const EVENT_HANDLERS = {
  click: '--cssx-on-click',
  load: '--cssx-on-load',
}

const injectStyles = () => {
  const STYLE_TAG_CLASS = 'cssx-style-root'
  if (document.querySelector(`.${STYLE_TAG_CLASS}`)) return

  const $style = document.createElement('style')
  $style.className = STYLE_TAG_CLASS

  const properties = ['--cssx-children', ...Object.values(EVENT_HANDLERS)]

  $style.textContent = `.cssx-layer {
    ${properties.map((p) => `${p}: ${UNSET_PROPERTY_VALUE};`).join(' ')}
  }`

  document.body.appendChild($style)
}

const getPropertyValue = ($element: Element, prop: string) => {
  const value = `${getComputedStyle($element).getPropertyValue(prop)}`.trim()
  return !value || value === UNSET_PROPERTY_VALUE ? '' : value
}

const getChildrenIds = ($element: Element) => {
  const value = getPropertyValue($element, '--cssx-children')
  return value.split(/(\s*,\s*)|\s+/g).filter(Boolean)
}

const evalDeps = (_el: Element): Dependencies => ({
  addClass: async (id, cls) => document.getElementById(id)?.classList.add(cls),
  removeClass: async (id, cls) =>
    document.getElementById(id)?.classList.remove(cls),
  delay: (delay) => new Promise((res) => setTimeout(res, delay)),
  jsEval: async (js) => (0, eval)(js),
})

const handleEvents = async ($element: Element) => {
  for (const [event, property] of Object.entries(EVENT_HANDLERS)) {
    const handlerExpr = getPropertyValue($element, property)

    if (handlerExpr) {
      ;($element as any)[`on${event}`] = async () => {
        console.log(`Triggered event: ${event}`)
        const exprs = parse(handlerExpr)
        for (const expr of exprs) {
          await evalExpr(expr, evalDeps($element))
        }
      }
    }
  }
}

let nodeCount = 0
const manageElement = async ($element: Element) => {
  if (nodeCount++ > 100) return // NOTE: Temporary. To prevent infinite rec

  await handleEvents($element)
  const childrenIds = getChildrenIds($element)

  if (childrenIds.length > 0) {
    const $childrenRoot =
      $element.querySelector(':scope > .cssx-layer') ??
      Object.assign(document.createElement('div'), {
        className: 'cssx-layer',
      })
    $element.appendChild($childrenRoot)

    for (const id of childrenIds) {
      const $child =
        $childrenRoot.querySelector(`:scope > #${id}`) ??
        Object.assign(document.createElement('div'), { id })
      $childrenRoot.appendChild($child)
      await manageElement($child)
    }
  }
}

interface Options {
  root?: HTMLElement
}
const render = async ({ root = document.body }: Options = {}) => {
  injectStyles()
  await manageElement(root)
}

render()
