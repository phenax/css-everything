import { Enum, constructors, match, matchString } from './utils/adt'
import * as P from './utils/parser-comb'
import { Result } from './utils/result'

// TODO: vh, vw
export type CSSUnit = '' | 's' | 'ms' | 'px' | '%' | 'rem' | 'em'

export type BinOp = '+' | '-' | '*' | '/'

export interface Selector {
  tag: string | undefined
  id: string
  selectors: Array<SelectorComp>
}

export type SelectorComp = Enum<{
  ClassName: string
  Attr: readonly [string, string]
}>
export const SelectorComp = constructors<SelectorComp>()

export type Expr = Enum<{
  Call: { name: string; args: Expr[] }
  Identifier: string
  VarIdentifier: string
  LiteralString: string
  LiteralNumber: { value: number; unit: CSSUnit }
  BinOp: { op: BinOp; left: Expr; right: Expr }
  Parens: { expr: Expr }

  Pair: { key: string; value: Expr }
  Selector: Selector
}>

export const Expr = constructors<Expr>()

const whitespace = P.regex(/^\s*/)
const consumeWhitespace = <A>(p: P.Parser<A>): P.Parser<A> =>
  P.between(whitespace, p, whitespace)
const comma = consumeWhitespace(P.string(','))
const parens = <A>(p: P.Parser<A>): P.Parser<A> =>
  P.between(P.string('('), p, P.string(')'))
const identifierParser = P.regex(/^[a-z][a-z0-9_-]*/i)
const varIdentifierParser = P.regex(/^--[a-z][a-z0-9-]*/i)
const singleQuote = P.string("'")
const doubleQuote = P.string('"')

const identifierExprParser = P.map(identifierParser, Expr.Identifier)
const varIdentifierExprParser = P.map(varIdentifierParser, Expr.VarIdentifier)

const callExprParser =
  (fnParser?: P.Parser<string>, argParser?: P.Parser<Expr>) =>
  (input: string) =>
    P.map(
      P.zip2(
        consumeWhitespace(fnParser ?? identifierParser),
        parens(consumeWhitespace(P.sepBy(argParser ?? exprParser, comma))),
      ),
      ([name, args]) => Expr.Call({ name, args }),
    )(input)

const stringLiteralParser = P.or([
  P.between(singleQuote, P.regex(/^[^']*/), singleQuote),
  P.between(doubleQuote, P.regex(/^[^"]*/), doubleQuote),
])
const stringLiteralExprParser: P.Parser<Expr> = P.map(
  stringLiteralParser,
  Expr.LiteralString,
)

const unitParser = P.regex(/^(s|ms|%|px|rem|em)/i)
const numberParser = P.regex(/^[-+]?((\d*\.\d+)|\d+)/)
const numberExprParser: P.Parser<Expr> = P.map(
  P.zip2(numberParser, P.optional(unitParser)),
  ([value, unit]) =>
    Expr.LiteralNumber({ value: Number(value), unit: (unit ?? '') as CSSUnit }),
)

const tagP = identifierParser
const idP = P.prefixed(P.string('#'), identifierParser)
const classP = P.map(
  P.prefixed(P.string('.'), identifierParser),
  SelectorComp.ClassName,
)
const valueP = P.or([identifierParser, stringLiteralParser, numberParser])
const attrP = P.map(
  P.between(
    P.string('['),
    P.zip2(P.suffixed(identifierParser, P.string('=')), valueP),
    P.string(']'),
  ),
  SelectorComp.Attr,
)

const selectorExprParser: P.Parser<Expr> = (input: string) =>
  P.map(
    P.zip2(P.zip2(P.optional(tagP), idP), P.many0(P.or([classP, attrP]))),
    ([[tag, id], selectors]) => Expr.Selector({ tag, id, selectors }),
  )(input)

const pairExprParser: P.Parser<Expr> = (input: string) =>
  P.map(
    P.zip2(
      P.suffixed(varIdentifierParser, consumeWhitespace(P.string(':'))),
      exprParser,
    ),
    ([key, value]) => Expr.Pair({ key, value }),
  )(input)

const precedence = (op: BinOp) =>
  matchString(op, {
    '+': () => 0,
    '-': () => 0,
    '*': () => 1,
    '/': () => 2,
    _: () => -1,
  })

const binOpWithFixitySwitchity = (op: BinOp, left: Expr, right: Expr) =>
  match(right, {
    BinOp: binOp => {
      if (precedence(op) >= precedence(binOp.op)) {
        return Expr.BinOp({
          op: binOp.op,
          left: binOpWithFixitySwitchity(op, left, binOp.left),
          right: binOp.right,
        })
      }
      return Expr.BinOp({ op, left, right })
    },
    Parens: ({ expr }) => Expr.BinOp({ op, left, right: expr }),
    _: () => Expr.BinOp({ op, left, right }),
  })

const allowParens = (p: P.Parser<Expr>): P.Parser<Expr> =>
  P.or([P.map(parens(p), expr => Expr.Parens({ expr })), p])

const binOpP = P.regex(/^[+\-*/]/)

const binOpExprParser: P.Parser<Expr> = allowParens((input: string) =>
  match(exprParser(input), {
    Ok: ({ value, input: rest }) =>
      P.map(
        P.optional(P.zip2(consumeWhitespace(binOpP), binOpExprParser)),
        res =>
          res
            ? binOpWithFixitySwitchity(res[0] as BinOp, value, res[1])
            : value,
      )(rest),
    Err: _ => Result.Ok({ value: [], input }),
  }),
)

const exprParser: P.Parser<Expr> = allowParens(
  P.or([
    stringLiteralExprParser,
    numberExprParser,
    callExprParser(P.string('calc'), binOpExprParser),
    callExprParser(),
    pairExprParser,
    varIdentifierExprParser,
    selectorExprParser,
    identifierExprParser,
  ]),
)

export const parseExpr = (input: string): Expr => {
  return match(exprParser(input), {
    Ok: ({ value, input }) => {
      if (input) throw new Error(`Aaaaaa. Input left: ${input}`)
      return value
    },
    Err: e => {
      throw e
    },
  })
}

const declarationParser = P.or([callExprParser(), selectorExprParser])

const multiDeclarationParser = P.sepBy(declarationParser, whitespace)

export const parseDeclarations = (input: string) =>
  match<Array<Expr>, P.ParseResult<Array<Expr>>>(
    multiDeclarationParser(input),
    {
      Ok: ({ value, input }) => {
        if (input) {
          console.error(`Declaration stopped parsing at: "${input}"`)
        }
        return value
      },
      Err: ({ error }) => {
        console.error(error)
        return []
      },
    },
  )

export const parse = (input: string): Array<Expr> => {
  const res = P.sepBy(exprParser, P.or([comma, whitespace]))(input.trim())
  return match(res, {
    Ok: ({ value, input }) => {
      if (input) {
        throw new Error(`Input not consumed completely here brosky: "${input}"`)
      }
      return value
    },
    Err: ({ error, input }) => {
      throw new Error(`${error}.\n Left input: ${input.slice(0, 20)}...`)
    },
  })
}
