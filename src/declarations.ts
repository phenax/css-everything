import { EvalActions, EvalValue, evalExpr } from './eval'
import { Expr, Selector, SelectorComp, parseDeclarations } from './parser'
import { match, matchString } from './utils/adt'

export interface Declaration {
  selector: Selector
  properties: Map<string, EvalValue>
  children: Array<Declaration>
  isInstance: boolean
}

const instanceCountMap = new Map<string, number>()
const getUniqueInstanceId = (id: string) => {
  const instanceCount = instanceCountMap.get(id) ?? 0
  instanceCountMap.set(id, instanceCount + 1)
  return `${id}--index-${instanceCount}`
}

export const toDeclaration =
  (actions: EvalActions) =>
  async (expr: Expr): Promise<Declaration | undefined> => {
    let selector: Selector | undefined
    const properties: Map<string, EvalValue> = new Map()
    const children: Array<Declaration> = []
    let isInstance = false

    await match(expr, {
      Selector: async sel => {
        selector = sel
      },
      Call: async ({ name, args }) => {
        return matchString(name, {
          h: async () => {
            const [sel, map, childreExpr] = args

            // Selector
            match(sel, {
              Selector: sel => {
                selector = sel
              },
              _: _ => {},
            })

            const props = await evalExpr(map, actions)
            match(props, {
              Map: props => {
                for (const [key, value] of Object.entries(props)) {
                  properties.set(key, value)
                }
              },
              _: _ => {},
            })

            const childrenExprs = await match<
              Promise<Array<Declaration | undefined>>,
              EvalValue
            >(await evalExpr(childreExpr, actions), {
              Lazy: async exprs =>
                Promise.all(exprs.map(toDeclaration(actions))),
              _: async _ => [],
            })

            children.push(
              ...(childrenExprs.filter(Boolean) as Array<Declaration>),
            )
          },
          instance: async () => {
            isInstance = true
            const [sel, map] = args

            // Selector
            match(sel, {
              Selector: sel => {
                selector = sel
              },
              _: _ => {},
            })

            const props = await evalExpr(map, actions)
            match(props, {
              Map: props => {
                for (const [key, value] of Object.entries(props)) {
                  properties.set(key, value)
                }
              },
              _: _ => {},
            })
          },
          _: async () => {
            throw new Error(`weird function in cssx-chi9ldren: ${name}`)
          },
        })
      },
      _: async () => {},
    })

    if (!selector) return undefined

    if (isInstance) {
      const baseId = selector.id
      selector.id = getUniqueInstanceId(selector.id)
      selector.selectors.push(SelectorComp.Attr(['data-instance', baseId]))
    }

    return { selector, properties, children, isInstance }
  }

export const expressionsToDeclrs = async (
  exprs: Array<Expr>,
  actions: EvalActions,
): Promise<Array<Declaration>> => {
  const declrs = await Promise.all(exprs.map(toDeclaration(actions)))
  return declrs.filter(declr => !!declr) as Array<Declaration>
}

export const extractDeclaration = async (
  input: string,
  actions: EvalActions,
): Promise<Array<Declaration>> => {
  const exprs = parseDeclarations(input)
  return expressionsToDeclrs(exprs, actions)
}
