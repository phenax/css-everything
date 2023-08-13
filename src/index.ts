import { EvalActions, evalExpr } from './eval'
import {
  extractDeclaration,
  DeclarationEval,
  Declaration,
  expressionsToDeclrs,
} from './declarations'
import { parse } from './parser'
import { match } from './utils/adt'

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
  '--cssx-disgustingly-set-innerhtml',
]

export const injectStyles = () => {
  const STYLE_TAG_CLASS = 'cssx-style-root'
  if (document.querySelector(`.${STYLE_TAG_CLASS}`)) return

  const $style = document.createElement('style')
  $style.className = STYLE_TAG_CLASS

  const properties = [...PROPERTIES, ...Object.values(EVENT_HANDLERS)]

  $style.textContent = `.cssx-layer {
    ${properties.map(p => `${p}: ${UNSET_PROPERTY_VALUE};`).join(' ')}
  }`

  document.body.appendChild($style)
}

export const getPropertyValue = ($element: Element, prop: string) => {
  const value = `${getComputedStyle($element).getPropertyValue(prop)}`.trim()
  return !value || value === UNSET_PROPERTY_VALUE ? '' : value
}

export const getDeclarations = (
  $element: Element,
  actions: EvalActions,
): Promise<Array<DeclarationEval>> => {
  const value = getPropertyValue($element, '--cssx-children')
  return extractDeclaration(value, actions)
}

const getEvalActions = (
  $element: Element,
  { event = null, pure = false }: { event?: any; pure?: boolean },
): EvalActions => {
  const actions: EvalActions = {
    addClass: async (id, cls) =>
      document.getElementById(id)?.classList.add(cls),
    removeClass: async (id, cls) =>
      document.getElementById(id)?.classList.remove(cls),
    delay: delay => new Promise(res => setTimeout(res, delay)),
    jsEval: async js => (0, eval)(js),
    loadCssx: async (id, url) =>
      new Promise((resolve, reject) => {
        const $link = Object.assign(document.createElement('link'), {
          href: url,
          rel: 'stylesheet',
        })
        $link.onload = () => {
          const $el = document.getElementById(id)
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
    getVariable: async varName => getPropertyValue($element, varName),
    updateVariable: async (targetId, varName, value) => {
      const $el = document.getElementById(targetId)
      if ($el) {
        $el.style.setProperty(varName, JSON.stringify(value))
      }
    },
    setAttribute: async (id, name, value) => {
      const $el = id ? document.getElementById(id) : $element
      if (name === 'value') {
        ;($el as any).value = value
      } else if (value) {
        $el?.setAttribute(name, value)
      } else {
        $el?.removeAttribute(name)
      }
    },
    getAttribute: async (id, name) => {
      const $el = id ? document.getElementById(id) : $element
      if (name === 'value') return ($el as any).value
      return $el?.getAttribute(name) ?? undefined
    },
    withEvent: async fn => event && fn(event),
    getFormData: async () =>
      $element.nodeName === 'FORM'
        ? new FormData($element as HTMLFormElement)
        : undefined,
    sendRequest: async ({ url, method, data }) => {
      await fetch(url, { method, body: data })
      // TODO: Handle response?
    },
    addChildren: async (id, children) => {
      const $el = document.getElementById(id)
      const declarations = await expressionsToDeclrs(children, actions)
      $el && createLayer(declarations, $el)
    },
    removeElement: async id => {
      const $el = id ? document.getElementById(id) : $element
      $el?.parentNode?.removeChild($el)
    },
  }
  return actions
}

export const handleEvents = async (
  $element: Element,
  isNewElement: boolean = false,
) => {
  for (const [eventType, property] of Object.entries(EVENT_HANDLERS)) {
    const handlerExpr = getPropertyValue($element, property)

    if (handlerExpr) {
      const eventHandler = async (event: any) => {
        const exprs = parse(handlerExpr)
        for (const expr of exprs) {
          await evalExpr(expr, getEvalActions($element, { event }))
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

const declarationToElement = (
  declaration: DeclarationEval,
  $parent?: Element,
) => {
  const { tag, id, selectors } = declaration.selector
  const tagName = tag || 'div'

  let $child = $parent?.querySelector(`:scope > #${id}`)
  const isNewElement = !$child
  if (!$child) {
    $child = Object.assign(document.createElement(tagName), { id })
  }

  // Add selectors
  for (const selector of selectors) {
    match(selector, {
      ClassName: cls =>
        !$child?.classList.contains(cls) && $child?.classList.add(cls),
      Attr: ([key, val]) => $child?.setAttribute(key, val),
    })
  }

  for (const [key, value] of declaration.properties) {
    ;($child as HTMLElement)?.style.setProperty(key, value)
  }

  return { node: $child, isNewElement }
}

const createLayer = async (
  declarations: Array<DeclarationEval>,
  $parent: Element,
) => {
  const LAYER_CLASS = 'cssx-layer'
  const $childrenRoot =
    $parent?.querySelector(`:scope > .${LAYER_CLASS}`) ??
    Object.assign(document.createElement('div'), { className: LAYER_CLASS })

  for (const declaration of declarations) {
    const { node: $child, isNewElement } = declarationToElement(
      declaration,
      $childrenRoot,
    )
    $childrenRoot.appendChild($child)
    await manageElement($child, isNewElement)
  }

  if (!$childrenRoot.parentNode) $parent.appendChild($childrenRoot)
}

export const manageElement = async (
  $element: Element,
  isNewElement: boolean = false,
) => {
  await handleEvents($element, isNewElement)

  const actions = getEvalActions($element, { pure: true })

  const text = getPropertyValue($element, '--cssx-text')
  if (text) {
    const exprs = parse(text)
    try {
      $element.textContent =
        (exprs[0] ? await evalExpr(exprs[0], actions) : text) ?? text
    } catch (e) {
      console.log(e, exprs)
      $element.textContent = text
    }
  }

  const html = getPropertyValue($element, '--cssx-disgustingly-set-innerhtml')
  if (html) $element.innerHTML = html.replace(/(^'|")|('|"$)/g, '')

  const declarations = await getDeclarations($element, actions)
  if (declarations.length > 0) {
    await createLayer(declarations, $element)
  }
}

export interface Options {
  root?: HTMLElement
}
export const render = async ({ root = document.body }: Options = {}) => {
  injectStyles()
  await manageElement(root)
}
