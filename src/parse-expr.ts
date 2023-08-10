import { Enum, constructors, match } from './utils/adt';
import * as P from './utils/parser-comb'

export type Expr = Enum<{
  Call: { name: string, args: Expr[] }
  Var: { name: string, defaultValue: Expr }
  Identifier: string
  Chain: { exprs: Expr[] }
  LiteralString: string
}>

export const Expr = constructors<Expr>()

const whitespace = P.regex(/\s*/)
const consumeWhitespace = <A>(p: P.Parser<A>): P.Parser<A> => P.between(whitespace, p, whitespace)
const comma = consumeWhitespace(P.string(','))
const parens = <A>(p: P.Parser<A>): P.Parser<A> => P.between(P.string('('), p, P.string(')'))
const identifierParser = P.regex(/^[a-z][a-z0-9_-]*/i)

const identifierExprParser = P.map(identifierParser, ident => Expr.Identifier(ident))

const callExprParser = (input: string) => P.map(P.zip2(
  consumeWhitespace(identifierParser),
  parens(consumeWhitespace(P.sepBy(exprParser, comma))),
), ([name, args]) => Expr.Call({ name, args }))(input)

const exprParser: P.Parser<Expr> = P.or([
  callExprParser,
  identifierExprParser,
])

const multiExpr = P.many1(exprParser)

export const parse = (input: string): Array<Expr> => {
  const res = multiExpr(input.trim());
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

