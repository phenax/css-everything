import { Expr } from "./parser";
import { match, matchString } from "./utils/adt";

export type Dependencies = {
  addClass(id: string, classes: string): Promise<void>
  removeClass(id: string, classes: string): Promise<void>
  delay(num: number): Promise<void>
  jsEval(js: string): Promise<any>
  // requestGetCss(url: string): Promise<string>
  // getVarable(name: string, def?: string): Promise<string>
  // updateVariable(id: string, varName: string, value: string): Promise<void>
  // calculate ??
}

export const evalExpr = async (expr: Expr, deps: Dependencies): Promise<string | undefined> =>
  match<Promise<string | undefined>, Expr>(expr, {
    Call: async ({ name, args }) => {
      await matchString(name, {
        'add-class': async () => {
          const id = await evalExpr(args[0], deps)
          const classes = await evalExpr(args[1], deps)
          if (id && classes) {
            await deps.addClass(id, classes)
          }
        },
        'remove-class': async () => {
          const id = await evalExpr(args[0], deps)
          const classes = await evalExpr(args[1], deps)
          if (id && classes) {
            await deps.removeClass(id, classes)
          }
        },
        'delay': async () => {
          const num = await evalExpr(args[0], deps)
          num && await deps.delay(parseInt(num, 10))
        },
        'js-eval': async () => {
          const js = await evalExpr(args[0], deps)
          js && await deps.jsEval(js)
        },
        _: () => Promise.reject(new Error('not supposed to be here')),
      })
      return undefined
    },
    LiteralString: async s => s,
    Identifier: async s => s,
    VarIdentifier: async s => s,
    _: async _ => undefined,
  })

