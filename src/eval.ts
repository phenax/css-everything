import { Expr } from "./parser";
import { match, matchString } from "./utils/adt";

export type EvalActions = {
  addClass(id: string, classes: string): Promise<void>
  removeClass(id: string, classes: string): Promise<void>
  delay(num: number): Promise<void>
  jsEval(js: string): Promise<any>
  loadCssx(id: string, url: string): Promise<string>
  getVariable(name: string): Promise<string | undefined>
  updateVariable(id: string, varName: string, value: string): Promise<void>
  // calculate ??
}

type EvalValue = string | undefined | void

export const evalExpr = async (expr: Expr, actions: EvalActions): Promise<EvalValue> =>
  match<Promise<EvalValue>, Expr>(expr, {
    Call: async ({ name, args }) => {
      return matchString<Promise<EvalValue>, string>(name, {
        'add-class': async () => {
          const id = await evalExpr(args[0], actions)
          const classes = await evalExpr(args[1], actions)
          if (id && classes) {
            await actions.addClass(id, classes)
          }
        },
        'remove-class': async () => {
          const id = await evalExpr(args[0], actions)
          const classes = await evalExpr(args[1], actions)
          if (id && classes) {
            await actions.removeClass(id, classes)
          }
        },
        'delay': async () => {
          const num = await evalExpr(args[0], actions)
          num && await actions.delay(parseInt(num, 10))
        },
        'js-eval': async () => {
          const js = await evalExpr(args[0], actions)
          js && await actions.jsEval(js)
        },
        'load-cssx': async () => {
          const id = await evalExpr(args[0], actions)
          const url = await evalExpr(args[1], actions)
          if (id && url) {
            await actions.loadCssx(id, url)
          }
        },
        'var': async () => {
          const varName = await evalExpr(args[0], actions)
          const defaultValue = await evalExpr(args[1], actions)
          return varName && (actions.getVariable(varName) ?? defaultValue)
        },
        'update': async () => {
          const id = await evalExpr(args[0], actions)
          const varName = await evalExpr(args[1], actions)
          const value = await evalExpr(args[2], actions)
          if (id && varName && value) {
            actions.updateVariable(id, varName, value)
          }
        },
        _: () => Promise.reject(new Error('not supposed to be here')),
      })
    },
    LiteralString: async s => s,
    Identifier: async s => s,
    VarIdentifier: async s => s,
    _: async _ => undefined,
  })


