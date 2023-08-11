import { Enum, constructors, match } from './utils/adt'
import * as P from './utils/parser-comb'

type Unit = '' | 's' | 'ms'

export type Expr = Enum<{
  Call: { name: string; args: Expr[] }
  Identifier: string
  VarIdentifier: string
  LiteralString: string
  LiteralNumber: { value: number, unit: Unit }
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
      parens(consumeWhitespace(P.sepBy(exprParser, comma)))
    ),
    ([name, args]) => Expr.Call({ name, args })
  )(input)

const stringLiteralParser: P.Parser<Expr> = P.map(
  P.or([
    P.between(singleQuote, P.regex(/^[^']*/), singleQuote),
    P.between(doubleQuote, P.regex(/^[^"]*/), doubleQuote),
  ]),
  Expr.LiteralString
)

const numberParser = P.regex(/^[-+]?((\d*\.\d+)|\d+)/)

const numberExprParser: P.Parser<Expr> = P.map(
  P.zip2(numberParser, P.optional(P.regex(/^(s|ms)/i))),
  ([value, unit]) => Expr.LiteralNumber({ value: Number(value), unit: (unit ?? '') as Unit }),
)

const exprParser: P.Parser<Expr> = P.or([
  stringLiteralParser,
  varIdentifierExprParser,
  numberExprParser,
  callExprParser,
  identifierExprParser,
])

const multiExprParser = P.many1(exprParser)

export const parse = (input: string): Array<Expr> => {
  const res = multiExprParser(input.trim())
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
