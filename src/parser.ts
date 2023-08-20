import { Enum, constructors, match } from './utils/adt'
import * as P from './utils/parser-comb'

export type CSSUnit = '' | 's' | 'ms'

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

const callExprParser = (input: string) =>
  P.map(
    P.zip2(
      consumeWhitespace(identifierParser),
      parens(consumeWhitespace(P.sepBy(exprParser, comma))),
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

const numberParser = P.regex(/^[-+]?((\d*\.\d+)|\d+)/)
const numberExprParser: P.Parser<Expr> = P.map(
  P.zip2(numberParser, P.optional(P.regex(/^(s|ms)/i))),
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

const exprParser: P.Parser<Expr> = P.or([
  stringLiteralExprParser,
  numberExprParser,
  callExprParser,
  pairExprParser,
  varIdentifierExprParser,
  selectorExprParser,
  identifierExprParser,
])

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

const declarationParser = P.or([callExprParser, selectorExprParser])

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
  const res = P.many1(exprParser)(input.trim())
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
