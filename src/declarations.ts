import { EvalActions, evalExpr } from './eval'
import { Expr, Selector, SelectorComp, parseDeclarations } from './parser'
import { match, matchString } from './utils/adt'

export interface Declaration {
  selector: Selector
  properties: Map<string, Expr>
}

export interface DeclarationEval {
  selector: Selector
  properties: Array<readonly [string, string]>
}

export const evaluateDeclaration = async (
  { selector, properties }: Declaration,
  actions: EvalActions,
): Promise<DeclarationEval> => {
  if (properties.size === 0) return { selector, properties: [] }

  const props = await Promise.all(
    [...properties.entries()].map(async ([key, expr]) => {
      // Ignore errors?
      const result = await evalExpr(expr, actions).catch(e => console.warn(e))
      return [key, result ?? ''] as const
    }),
  )

  return { selector, properties: props }
}

const instanceCountMap = new Map<string, number>()
const getUniqueInstanceId = (id: string) => {
  const instanceCount = instanceCountMap.get(id) ?? 0
  instanceCountMap.set(id, instanceCount + 1)
  return `${id}--index-${instanceCount}`
}

export const toDeclaration = (expr: Expr): Declaration | undefined => {
  let selector: Selector | undefined
  const properties: Map<string, Expr> = new Map()
  let isInstance = false

  match(expr, {
    Selector: sel => {
      selector = sel
    },
    Call: ({ name, args }) => {
      matchString(name, {
        instance: () => {
          isInstance = true
          const [sel, map] = args
          match(sel, {
            Selector: sel => {
              selector = sel
            },
            _: _ => {},
          })
          match(map, {
            Call: ({ name, args }) => {
              if (name !== 'map') return
              for (const arg of args) {
                match(arg, {
                  Pair: ({ key, value }) => properties.set(key, value),
                  _: _ => {},
                })
              }
            },
          })
        },
        _: () => {
          throw new Error(`weird function in cssx-chi9ldren: ${name}`)
        },
      })
    },
    _: () => {},
  })

  if (!selector) return undefined

  if (isInstance) {
    const baseId = selector.id
    selector.id = getUniqueInstanceId(selector.id)
    selector.selectors.push(SelectorComp.Attr(['data-instance', baseId]))
  }

  return { selector, properties }
}

export const expressionsToDeclrs = async (
  exprs: Array<Expr>,
  actions: EvalActions,
) => {
  const declrs = await Promise.all(
    exprs
      .map(toDeclaration)
      .filter(declr => !!declr)
      .map(declr => declr && evaluateDeclaration(declr, actions)),
  )
  return declrs.filter(declr => !!declr) as Array<DeclarationEval>
}

export const extractDeclaration = async (
  input: string,
  actions: EvalActions,
): Promise<Array<DeclarationEval>> => {
  const exprs = parseDeclarations(input)
  return expressionsToDeclrs(exprs, actions)
}
