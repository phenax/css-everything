import { EvalActions, evalExpr } from './eval'
import { parse } from './parser'

const UNSET_PROPERTY_VALUE = '<unset>'
const EVENT_HANDLERS = {
  click: '--cssx-on-click',
  load: '--cssx-on-load',
  mount: '--cssx-on-mount',
  submit: '--cssx-on-submit',
}

const PROPERTIES = [
  '--cssx-children',
  '--cssx-text',
  '--cssx-disgustingly-set-innerhtml'
]

const injectStyles = () => {
  const STYLE_TAG_CLASS = 'cssx-style-root'
  if (document.querySelector(`.${STYLE_TAG_CLASS}`)) return

  const $style = document.createElement('style')
  $style.className = STYLE_TAG_CLASS

  const properties = [...PROPERTIES, ...Object.values(EVENT_HANDLERS)]

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

const getEvalActions = ($element: Element, event: any): EvalActions => ({
  addClass: async (id, cls) => document.getElementById(id)?.classList.add(cls),
  removeClass: async (id, cls) =>
    document.getElementById(id)?.classList.remove(cls),
  delay: (delay) => new Promise((res) => setTimeout(res, delay)),
  jsEval: async (js) => (0, eval)(js),
  loadCssx: async (id, url) =>
    new Promise((resolve, reject) => {
      const $link = Object.assign(document.createElement('link'), {
        href: url,
        rel: 'stylesheet',
      })
      $link.onload = () => {
        const $el = document.getElementById(id)
        // NOTE: Maybe create and append to body if no root?
        if ($el) {
          manageElement($el)
          resolve(id)
        } else {
          console.error(`[CSSX] Unable to find root for ${id}`)
          reject(`[CSSX] Unable to find root for ${id}`)
        }
      }
      document.body.appendChild($link)
    }),
  getVariable: async (varName) => getPropertyValue($element, varName),
  updateVariable: async (targetId, varName, value) => {
    const $el = document.getElementById(targetId)
    if ($el) {
      $el.style.setProperty(varName, JSON.stringify(value))
    }
  },
  setAttribute: async (name, value) => {
    $element.setAttribute(name, value)
  },
  withEvent: async (fn) => fn(event),
  getFormData: async () => $element.nodeName === 'FORM' ? new FormData($element as HTMLFormElement) : undefined,
  sendRequest: async ({ url, method, data }) => {
    await fetch(url, { method, body: data })
    // TODO: Handle response?
  },
})

const handleEvents = async ($element: Element, isNewElement: boolean = false) => {
  for (const [eventType, property] of Object.entries(EVENT_HANDLERS)) {
    const handlerExpr = getPropertyValue($element, property)

    if (handlerExpr) {
      const eventHandler = async (event: any) => {
        console.log(`Triggered event: ${eventType}`)
        const exprs = parse(handlerExpr)
        for (const expr of exprs) {
          await evalExpr(expr, getEvalActions($element, event))
        }
      }

      if (eventType === 'mount') {
        if (isNewElement) setTimeout(eventHandler)
      } else {
        ;($element as any)[`on${eventType}`] = eventHandler
      }
    }
  }
}

let nodeCount = 0
const manageElement = async ($element: Element, isNewElement: boolean = false) => {
  if (nodeCount++ > 100) return // NOTE: Temporary. To prevent infinite rec

  await handleEvents($element, isNewElement)

  const text = getPropertyValue($element, '--cssx-text')
  if (text) $element.textContent = text

  const html = getPropertyValue($element, '--cssx-disgustingly-set-innerhtml')
  if (html) $element.innerHTML = html

  const childrenIds = getChildrenIds($element)
  if (childrenIds.length > 0) {
    const LAYER_CLASS = 'cssx-layer'
    const $childrenRoot =
      $element.querySelector(`:scope > .${LAYER_CLASS}`) ??
      Object.assign(document.createElement('div'), { className: LAYER_CLASS })
    $element.appendChild($childrenRoot)

    for (const childId of childrenIds) {
      let isNewElement = false;
      const selector = childId.split('#')
      const [tag, id] = selector.length >= 2 ? selector : ['div', ...selector]
      const $child =
        $childrenRoot.querySelector(`:scope > #${id}`) ??
        (isNewElement = true, Object.assign(document.createElement(tag || 'div'), { id }))
      $childrenRoot.appendChild($child)
      await manageElement($child, isNewElement)
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
