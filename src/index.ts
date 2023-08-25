import {
  EvalActions,
  EvalValue,
  evalExpr,
  evalExprAsString,
  evalValueToString,
} from './eval'
import {
  extractDeclaration,
  DeclarationEval,
  expressionsToDeclrs,
} from './declarations'
import { Expr, parse } from './parser'
import { match, matchString } from './utils/adt'

const CSSX_ON_UPDATE_EVENT = 'cssx--update'
const CSSX_ON_MOUNT_EVENT = 'cssx--mount'

const UNSET_PROPERTY_VALUE = '<unset>'
const EVENT_HANDLERS = {
  click: '--cssx-on-click',
  load: '--cssx-on-load',
  submit: '--cssx-on-submit',
  blur: '--cssx-on-blur',
  focus: '--cssx-on-focus',
  [CSSX_ON_MOUNT_EVENT]: '--cssx-on-mount',
  [CSSX_ON_UPDATE_EVENT]: '--cssx-on-update',
}

const LAYER_CLASS_NAME = 'cssx-layer'

const PROPERTIES = {
  CHILDREN: '--cssx-children',
  TEXT: '--cssx-text',
  HTML: '--cssx-disgustingly-set-innerhtml',
}

export const injectStyles = () => {
  const STYLE_TAG_CLASS = 'cssx-style-root'
  if (document.querySelector(`.${STYLE_TAG_CLASS}`)) return

  const $style = document.createElement('style')
  $style.className = STYLE_TAG_CLASS

  const properties = [
    ...Object.values(PROPERTIES),
    ...Object.values(EVENT_HANDLERS),
  ]

  $style.textContent = `.cssx-layer {
    ${properties.map(p => `${p}: ${UNSET_PROPERTY_VALUE};`).join(' ')}
    display: inherit;
    width: inherit;
    height: inherit;
    align-items: inherit;
    justify-content: inherit;
  }`

  document.body.appendChild($style)
}

export const getPropertyValue = ($element: HTMLElement, prop: string) => {
  let value = `${getComputedStyle($element).getPropertyValue(prop)}`.trim()
  value = value.replace(/(^['"])|(['"]$)/gi, '')
  return !value || value === UNSET_PROPERTY_VALUE ? '' : value
}

export const getDeclarations = (
  $element: HTMLElement,
  actions: EvalActions,
): Promise<Array<DeclarationEval>> => {
  const value = getPropertyValue($element, PROPERTIES.CHILDREN)
  return extractDeclaration(value, actions)
}

const getElement = (
  id: string,
  $node: HTMLElement | Document = document,
): HTMLElement | null => {
  let $element: Node | null = document,
    selector: string = id

  if (/^('|")?[a-z0-9_-]+\1$/gi.test(id)) {
    selector = `[data-element=${id}]`
  } else if (/^:scope/i.test(id)) {
    $element = $node
  } else if (/^:parent\s+/i.test(id)) {
    $element = $node.parentNode
    selector = id.replace(/^:parent\s+/i, '')
  }

  return ($element as Element)?.querySelector<HTMLElement>(selector)
}

const getEvalActions = (
  $element: HTMLElement,
  ctx: { event?: any; pure?: boolean },
): EvalActions => {
  const { event = null, pure = false } = ctx

  const actions: EvalActions = {
    addClass: async (id, cls) => getElement(id, $element)?.classList.add(cls),
    removeClass: async (id, cls) =>
      getElement(id, $element)?.classList.remove(cls),
    delay: delay => new Promise(res => setTimeout(res, delay)),
    jsEval: async js => !pure && (0, eval)(js),
    loadCssx: async (id, url) =>
      pure
        ? ''
        : new Promise((resolve, reject) => {
            const $link = Object.assign(document.createElement('link'), {
              href: url,
              rel: 'stylesheet',
            })
            $link.onload = () => {
              const $el = getElement(id, $element)
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
      const $el = targetId ? getElement(targetId, $element) : $element
      const isCustomProp = varName.startsWith('--')
      if ($el) {
        const prevValue = getPropertyValue($el, varName)
        if (isCustomProp) {
          ;($el as any).style.setProperty(varName, JSON.stringify(value))
        } else {
          ;($el as any).style[varName] = value
        }

        if (JSON.stringify(value) !== prevValue && isCustomProp) {
          const detail = { name: varName, value, prevValue }
          $el.dispatchEvent(new CustomEvent(CSSX_ON_UPDATE_EVENT, { detail }))
        }
      }
    },
    setAttribute: async (id, name, value) => {
      const $el = id ? getElement(id, $element) : $element
      if (name === 'value') {
        ;($el as any).value = value
      } else if (value) {
        $el?.setAttribute(name, value)
      } else {
        $el?.removeAttribute(name)
      }
    },
    getAttribute: async (id, name) => {
      const $el = id ? getElement(id, $element) : $element
      if (name === 'value') return ($el as any).value
      return $el?.getAttribute(name) ?? undefined
    },
    withEvent: async fn => event && fn(event),
    getFormData: async () =>
      $element.nodeName === 'FORM'
        ? new FormData($element as HTMLFormElement)
        : undefined,
    sendRequest: async ({ url, method, data }) => {
      if (pure) return
      await fetch(url, { method, body: data })
      // TODO: Handle response?
    },
    addChildren: async (id, children) => {
      const $el = getElement(id, $element)
      const declarations = await expressionsToDeclrs(children, actions)
      $el && createLayer(declarations, $el)
    },
    removeElement: async id => {
      const $el = id ? getElement(id, $element) : $element
      $el?.parentNode?.removeChild($el)
    },
    callMethod: async (id, method, args) => {
      const $el = id ? getElement(id, $element) : $element
      ;($el as any)[method].call($el, args)
    },

    evaluateInScope: async (exprs, properties) => {
      const node = document.createElement('div')
      node.style.display = 'none'

      for (const [key, evalVal] of Object.entries(properties)) {
        const value = evalValueToString(evalVal)
        value && node.style.setProperty(key, value)
      }
      $element.appendChild(node)

      const result = await evalExprInScope(exprs, getEvalActions(node, ctx))

      if (!$element.hasAttribute('data-debug-stack')) {
        node.parentNode?.removeChild(node)
      }

      return result
    },
  }
  return actions
}

const evalExprInScope = async (
  exprs: Expr[],
  actions: EvalActions,
): Promise<EvalValue> => {
  let lastVal = EvalValue.Void()
  for (const expr of exprs) {
    lastVal = await evalExpr(expr, actions)
  }
  return lastVal
}

export const handleEvents = async (
  $element: HTMLElement,
  isNewElement: boolean = false,
) => {
  for (const [eventType, property] of Object.entries(EVENT_HANDLERS)) {
    const handlerExpr = getPropertyValue($element, property)

    if (handlerExpr) {
      const eventHandler = async (event: any) => {
        await evalExprInScope(
          parse(handlerExpr),
          getEvalActions($element, { event }),
        )
      }

      matchString(eventType, {
        [CSSX_ON_UPDATE_EVENT]: () => {
          if (!$element.hasAttribute('data-hooked')) {
            $element.addEventListener(eventType, eventHandler)
            $element.setAttribute('data-hooked', 'true')
          }
        },
        [CSSX_ON_MOUNT_EVENT]: () => {
          if (isNewElement) setTimeout(eventHandler)
        },
        _: () => {
          ;($element as any)[`on${eventType}`] = eventHandler
        },
      })
    }
  }
}

const declarationToElement = (
  declaration: DeclarationEval,
  $parent?: HTMLElement,
): { node: HTMLElement; isNewElement: boolean } => {
  const { tag, id, selectors } = declaration.selector
  const tagName = tag || 'div'

  let $child = $parent?.querySelector<HTMLElement>(`:scope > #${id}`)
  const isNewElement = !$child
  if (!$child) {
    $child = Object.assign(document.createElement(tagName), { id })
    $child.dataset.element = id
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
    $child?.style.setProperty(key, JSON.stringify(value))
  }

  return { node: $child, isNewElement }
}

const createLayer = async (
  declarations: Array<DeclarationEval>,
  $parent: HTMLElement,
) => {
  const $childrenRoot =
    $parent?.querySelector<HTMLElement>(`:scope > .${LAYER_CLASS_NAME}`) ??
    Object.assign(document.createElement('div'), {
      className: LAYER_CLASS_NAME,
    })

  if (!$childrenRoot.parentNode) $parent.appendChild($childrenRoot)

  for (const declaration of declarations) {
    const { node: $child, isNewElement } = declarationToElement(
      declaration,
      $childrenRoot,
    )
    $childrenRoot.appendChild($child)
    await manageElement($child, isNewElement)
  }
}

export const manageElement = async (
  $element: HTMLElement,
  isNewElement: boolean = false,
) => {
  await handleEvents($element, isNewElement)

  const actions = getEvalActions($element, { pure: true })

  const text = getPropertyValue($element, PROPERTIES.TEXT)
  if (text) {
    try {
      const exprs = parse(text)
      $element.textContent =
        (exprs[0] ? await evalExprAsString(exprs[0], actions) : text) ?? text
    } catch (e) {
      $element.textContent = text
    }
  }

  const html = getPropertyValue($element, PROPERTIES.HTML)
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
