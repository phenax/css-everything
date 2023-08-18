import { CSSUnit, Expr } from './parser'
import { match, matchString } from './utils/adt'

export interface EvalActions {
  addClass(id: string, classes: string): Promise<void>
  removeClass(id: string, classes: string): Promise<void>
  delay(num: number): Promise<void>
  jsEval(js: string): Promise<any>
  loadCssx(id: string, url: string): Promise<string>
  getVariable(name: string): Promise<string | undefined>
  updateVariable(
    id: string | undefined,
    varName: string,
    value: string,
  ): Promise<void>
  getAttribute(
    id: string | undefined,
    name: string,
  ): Promise<string | undefined>
  setAttribute(
    id: string | undefined,
    name: string,
    value: string,
  ): Promise<void>
  withEvent(fn: (e: any) => void): Promise<void>
  getFormData(): Promise<FormData | undefined>
  sendRequest(_: {
    method: string
    url: string
    data: FormData | undefined
  }): Promise<void>
  addChildren(id: string, children: Expr[]): Promise<void>
  removeElement(id: string | undefined): Promise<void>
  callMethod(
    id: string | undefined,
    method: string,
    args: EvalValue[],
  ): Promise<void>
  // calculate ??
}

type EvalValue = string | undefined | void

export const evalExpr = async (
  expr: Expr,
  actions: EvalActions,
): Promise<EvalValue> =>
  match<Promise<EvalValue>, Expr>(expr, {
    Call: async ({ name, args }) => getFunctions(name, args, actions),
    LiteralString: async s => s,
    LiteralNumber: async ({ value, unit }) =>
      matchString<number, CSSUnit>(unit, {
        s: () => value * 1000,
        _: () => value,
      }).toString(),
    Identifier: async s => s,
    VarIdentifier: async s => s,
    _: async _ => undefined,
  })

const getFunctions = (name: string, args: Expr[], actions: EvalActions) => {
  const getVariable = async () => {
    const varName = await evalExpr(args[0], actions)
    const defaultValue = args[1] && (await evalExpr(args[1], actions))
    return varName && (actions.getVariable(varName) ?? defaultValue)
  }

  return matchString<Promise<EvalValue>>(name, {
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

    if: async () => {
      const cond = await evalExpr(args[0], actions)
      const FALSEY = ['0', 'false']
      if (cond && !FALSEY.includes(cond.replace(/(^'|")|('|"$)/g, ''))) {
        return evalExpr(args[1], actions)
      } else {
        return evalExpr(args[2], actions)
      }
    },
    delay: async () => {
      const num = await evalExpr(args[0], actions)
      num && (await actions.delay(parseInt(num, 10)))
    },
    'js-eval': async () => {
      const js = await evalExpr(args[0], actions)
      js && (await actions.jsEval(js))
    },

    'load-cssx': async () => {
      const id = await evalExpr(args[0], actions)
      const url = await evalExpr(args[1], actions)
      if (id && url) {
        await actions.loadCssx(id, url)
      }
    },

    var: getVariable,
    'get-var': getVariable,

    update: async () => {
      const [id, name, value] =
        args.length >= 3
          ? await evalArgs(args, 3, actions)
          : [undefined, ...(await evalArgs(args, 2, actions))]
      if (name) {
        actions.updateVariable(id ?? undefined, name, value ?? '')
      }
    },

    'set-attr': async () => {
      const [id, name, value] =
        args.length >= 3
          ? await evalArgs(args, 3, actions)
          : [undefined, ...(await evalArgs(args, 2, actions))]
      if (name) {
        actions.setAttribute(id ?? undefined, name, value ?? '')
      }
    },
    attr: async () => {
      const [id, name] =
        args.length >= 2
          ? await evalArgs(args, 2, actions)
          : [undefined, await evalExpr(args[0], actions)]
      if (name) {
        return actions.getAttribute(id as string | undefined, name)
      }
    },

    'prevent-default': async () => actions.withEvent(e => e.preventDefault()),

    request: async () => {
      const url = await evalExpr(args[0], actions)
      const method = (args[1] && (await evalExpr(args[1], actions))) ?? 'post'

      if (url) {
        const data = await actions.getFormData()
        await actions.sendRequest({ method, url, data })
      }
    },

    'add-children': async () => {
      const id = await evalExpr(args[0], actions)
      if (id) actions.addChildren(id, args.slice(1))
    },
    'remove-element': async () =>
      actions.removeElement(
        (args[0] && (await evalExpr(args[0], actions))) ?? undefined,
      ),
    call: async () => {
      const [id, method, ...methodArgs] = await Promise.all(
        args.map(a => evalExpr(a, actions)),
      )
      if (id && method) {
        actions.callMethod(id, method, methodArgs)
      }
    },

    _: () => Promise.reject(new Error('not supposed to be here')),
  })
}

export const evalArgs = (
  args: Array<Expr>,
  count: number,
  actions: EvalActions,
) => Promise.all(args.slice(0, count).map(e => evalExpr(e, actions)))
