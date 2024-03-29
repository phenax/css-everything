import { CSSUnit, Expr, parse, parseExpr } from './parser'
import { Enum, constructors, match, matchString } from './utils/adt'

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
    args: (string | undefined)[],
  ): Promise<void>
  evaluateInScope(
    exprs: Expr[],
    properties: Record<string, EvalValue>,
  ): Promise<EvalValue>
  // calculate ??
}

export type EvalValue = Enum<{
  String: string
  Number: number
  Boolean: boolean
  Lazy: Array<Expr>
  Void: never
  VarIdentifier: string
  Map: { [key in string]: EvalValue }
  Value: any
}>
export const EvalValue = constructors<EvalValue>()

export const evalExprAsString = async (
  expr: Expr,
  actions: EvalActions,
): Promise<string | undefined> => {
  const evalVal = await evalExpr(expr, actions)
  return evalValueToString(evalVal)
}

export const evalExpr = async (
  expr: Expr,
  actions: EvalActions,
): Promise<EvalValue> => {
  return match<Promise<EvalValue>, Expr>(expr, {
    Call: async ({ name, args }) => getFunctions(name, args, actions),
    LiteralString: async s => EvalValue.String(s),
    LiteralNumber: async ({ value, unit }) =>
      EvalValue.Number(
        matchString<number, CSSUnit>(unit, {
          s: () => value * 1000,
          rem: () => value * 16, // TODO: get root font size
          em: () => value * 16, // TODO: get parent font size
          '%': () => value * 100, // TODO: Get parent width
          _: () => value,
        }),
      ),
    Identifier: async s => EvalValue.String(s),
    VarIdentifier: async s => EvalValue.VarIdentifier(s),
    Parens: ({ expr }) => evalExpr(expr, actions),
    _: async _ => EvalValue.Void(),
  })
}

const QUOTE_REGEX = /^['"](.*)(?=['"]$)['"]$/g
const unquotify = (s: string) => s.replace(QUOTE_REGEX, '$1')

export const evalValueToString = (val: EvalValue): string | undefined =>
  match<string | undefined, EvalValue>(val, {
    String: s => unquotify(s),
    Boolean: b => `${b}`,
    Number: n => `${n}`,
    VarIdentifier: s => s,
    Value: v => `${v}`,
    _: () => undefined,
  })

const evalValueToNumber = (val: EvalValue): number | undefined =>
  match<number | undefined, EvalValue>(val, {
    String: s => parseFloat(s),
    Boolean: b => (b ? 1 : 0),
    Number: n => n,
    Value: v => parseFloat(v),
    _: () => undefined,
  })

const evalValueToBoolean = (val: EvalValue): boolean =>
  match<boolean, EvalValue>(val, {
    String: s => !['false', '', '0'].includes(unquotify(s)),
    Boolean: b => b,
    Number: n => !!n,
    Value: v => !!v,
    _: () => false,
  })

const getFunctions = (
  name: string,
  args: Expr[],
  actions: EvalActions,
): Promise<EvalValue> => {
  const getVariable = async () => {
    const varName = await evalExpr(args[0], actions)
    const defaultValue = args[1]
      ? await evalExpr(args[1], actions)
      : EvalValue.Void()

    return match<Promise<EvalValue>, EvalValue>(varName, {
      VarIdentifier: async name => {
        const value = await actions.getVariable(name)
        return value === undefined ? defaultValue : EvalValue.String(value)
      },
      _: async () => EvalValue.Void(),
    })
  }

  const jsEval = async () => {
    const js = await evalExprAsString(args[0], actions)
    const result = js && (await actions.jsEval(js))
    if (result === undefined || result === null) return EvalValue.Void()
    return EvalValue.Value(result)
  }

  return matchString<Promise<EvalValue>>(name, {
    'add-class': async () => {
      const id = evalValueToString(await evalExpr(args[0], actions))
      const classes = evalValueToString(await evalExpr(args[1], actions))
      if (id && classes) {
        await actions.addClass(id, classes)
      }
      return EvalValue.Void()
    },
    'remove-class': async () => {
      const id = evalValueToString(await evalExpr(args[0], actions))
      const classes = evalValueToString(await evalExpr(args[1], actions))
      if (id && classes) {
        await actions.removeClass(id, classes)
      }
      return EvalValue.Void()
    },

    if: async () => {
      const cond = evalValueToBoolean(await evalExpr(args[0], actions))
      if (cond) {
        return evalExpr(args[1], actions)
      } else {
        return evalExpr(args[2], actions)
      }
    },
    delay: async () => {
      const num = evalValueToNumber(await evalExpr(args[0], actions))
      num !== undefined ? await actions.delay(num) : undefined
      return EvalValue.Void()
    },

    'js-eval': jsEval,
    'js-expr': jsEval,

    'load-cssx': async () => {
      const id = evalValueToString(await evalExpr(args[0], actions))
      const url = evalValueToString(await evalExpr(args[1], actions))
      if (id && url) {
        await actions.loadCssx(id, url)
      }
      return EvalValue.Void()
    },

    var: getVariable,
    'get-var': getVariable,

    update: async () => {
      const [id, name, value] =
        args.length >= 3
          ? (await evalArgs(args, 3, actions)).map(evalValueToString)
          : [
              undefined,
              ...(await evalArgs(args, 2, actions)).map(evalValueToString),
            ]
      if (name) {
        await actions.updateVariable(id ?? undefined, name, value ?? '')
      }
      return EvalValue.Void()
    },

    'set-attr': async () => {
      const [id, name, value] =
        args.length >= 3
          ? (await evalArgs(args, 3, actions)).map(evalValueToString)
          : [
              undefined,
              ...(await evalArgs(args, 2, actions)).map(evalValueToString),
            ]
      if (name) {
        actions.setAttribute(id ?? undefined, name, value ?? '')
      }
      return EvalValue.Void()
    },
    attr: async () => {
      const [id, name] =
        args.length >= 2
          ? (await evalArgs(args, 2, actions)).map(evalValueToString)
          : [undefined, evalValueToString(await evalExpr(args[0], actions))]
      if (name) {
        const val = await actions.getAttribute(id as string | undefined, name)
        return val === undefined ? EvalValue.Void() : EvalValue.String(val)
      }
      return EvalValue.Void()
    },

    'prevent-default': async () => {
      await actions.withEvent(e => e.preventDefault())
      return EvalValue.Void()
    },

    request: async () => {
      const url = evalValueToString(await evalExpr(args[0], actions))
      const method =
        (args[1] && evalValueToString(await evalExpr(args[1], actions))) ||
        'post'

      if (url) {
        const data = await actions.getFormData()
        await actions.sendRequest({ method, url, data })
      }
      return EvalValue.Void()
    },

    'add-children': async () => {
      const id = evalValueToString(await evalExpr(args[0], actions))
      if (id) await actions.addChildren(id, args.slice(1))
      return EvalValue.Void()
    },
    'remove-element': async () => {
      const selector =
        (args[0] && evalValueToString(await evalExpr(args[0], actions))) ??
        undefined
      if (selector) await actions.removeElement(selector)
      return EvalValue.Void()
    },

    'call-method': async () => {
      const [id, method, ...methodArgs] = (
        await Promise.all(args.map(a => evalExpr(a, actions)))
      ).map(evalValueToString)
      if (id && method) {
        await actions.callMethod(id, method, methodArgs)
      }
      return EvalValue.Void()
    },

    map: async () => {
      const values = await Promise.all(
        args.map(async mapExpr =>
          match<Promise<undefined | [string, EvalValue]>, Expr>(mapExpr, {
            Pair: async ({ key, value }) => [
              key,
              await evalExpr(value, actions),
            ],
            _: async () => undefined,
          }),
        ),
      )

      return EvalValue.Map(Object.fromEntries(values.filter(Boolean) as any))
    },

    seq: async () => EvalValue.Lazy(args),

    // noop
    noop: async () => EvalValue.Void(),
    func: async () => EvalValue.Void(),

    call: async () => {
      const varId = match<string | undefined, EvalValue>(
        await evalExpr(args[0], actions),
        {
          VarIdentifier: id => id,
          _: () => undefined,
        },
      )

      const propMapExpr = args[1]
        ? await evalExpr(args[1], actions)
        : EvalValue.Void()
      const properties = match<Record<string, EvalValue>, EvalValue>(
        propMapExpr,
        {
          Map: m => m,
          _: () => ({}),
        },
      )

      if (varId) {
        const prop = await actions.getVariable(varId)
        if (prop) {
          const exprs = parse(prop)
          return actions.evaluateInScope(exprs, properties)
        }
      }

      return EvalValue.Void()
    },

    string: async () => {
      const str = await Promise.all(args.map(a => evalExprAsString(a, actions)))
      return EvalValue.String(str.filter(Boolean).join(''))
    },
    quotify: async () => {
      const str = await evalExprAsString(args[0], actions)
      return EvalValue.String(`'${str || ''}'`)
    },
    unquotify: async () => {
      const str = await evalExprAsString(args[0], actions)
      return EvalValue.String(unquotify(str || ''))
    },

    try: async () => {
      try {
        return await evalExpr(args[0], actions)
      } catch (e) {
        return actions.evaluateInScope([args[1]], {
          '--error': EvalValue.Value(e),
        })
      }
    },

    do: async () => {
      let result = EvalValue.Void()
      for (const expr of args) {
        result = await evalExpr(expr, actions)
      }
      return result
    },

    let: async () => {
      const varName = await evalExprAsString(args[0], actions)
      const result = await evalExpr(args[1], actions)
      if (!varName) return EvalValue.Void()

      return actions.evaluateInScope([args[2]], {
        [varName]: result,
      })
    },

    calc: async () => {
      const result = await evalCalcExpr(args[0], actions)
      return EvalValue.Number(result)
    },

    // TODO: Structural comparison?
    equals: async () =>
      compare(
        args[0],
        args[1],
        actions,
        (a, b) => evalValueToString(a) === evalValueToString(b),
      ),

    gt: async () =>
      compare(
        args[0],
        args[1],
        actions,
        (a, b) => (evalValueToNumber(a) ?? 0) > (evalValueToNumber(b) ?? 0),
      ),

    lt: async () =>
      compare(
        args[0],
        args[1],
        actions,
        (a, b) => (evalValueToNumber(a) ?? 0) < (evalValueToNumber(b) ?? 0),
      ),

    gte: async () =>
      compare(
        args[0],
        args[1],
        actions,
        (a, b) => (evalValueToNumber(a) ?? 0) >= (evalValueToNumber(b) ?? 0),
      ),

    lte: async () =>
      compare(
        args[0],
        args[1],
        actions,
        (a, b) => (evalValueToNumber(a) ?? 0) <= (evalValueToNumber(b) ?? 0),
      ),

    _: () => Promise.reject(new Error(`Not implemented: ${name}`)),
  })
}

export const compare = async (
  a: Expr,
  b: Expr,
  actions: EvalActions,
  cmp: (a: EvalValue, b: EvalValue) => boolean,
) =>
  EvalValue.Boolean(cmp(await evalExpr(a, actions), await evalExpr(b, actions)))

const evalBinOp = async (
  left: Expr,
  right: Expr,
  actions: EvalActions,
  op: (a: number, b: number) => number,
): Promise<number> =>
  op(await evalCalcExpr(left, actions), await evalCalcExpr(right, actions))

export const evalCalcExpr = (
  expr: Expr,
  actions: EvalActions,
): Promise<number> =>
  match(expr, {
    BinOp: async ({ op, left, right }) =>
      matchString(op, {
        '+': () => evalBinOp(left, right, actions, (a, b) => a + b),
        '*': () => evalBinOp(left, right, actions, (a, b) => a * b),
        '-': () => evalBinOp(left, right, actions, (a, b) => a - b),
        '/': () => evalBinOp(left, right, actions, (a, b) => a / b),
        _: () =>
          Promise.reject(
            new Error(`Invalid operator in calc expression: ${op}`),
          ),
      }),
    Parens: ({ expr }) => evalCalcExpr(expr, actions),
    _: async () => {
      // Special expressions to double-evaluate
      if (expr.tag === 'Call' && ['var', 'get-var'].includes(expr.value.name)) {
        const value = await evalExprAsString(expr, actions)
        try {
          const pvalue = await evalExpr(parseExpr(value ?? ''), actions)
          return evalValueToNumber(pvalue) ?? 0
        } catch (e) {
          return 0
        }
      }
      const value = await evalExpr(expr, actions)
      return evalValueToNumber(value) ?? 0
    },
  })

export const evalArgs = (
  args: Array<Expr>,
  count: number,
  actions: EvalActions,
) => Promise.all(args.slice(0, count).map(e => evalExpr(e, actions)))
