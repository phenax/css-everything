import { Enum, constructors, match } from './utils/adt';
import * as P from './utils/parser-comb'

export type Expr = Enum<{
  Call: { name: string, args: Expr[] }
  Var: { name: string, defaultValue: Expr }
  Identifier: string
  LiteralString: string
}>

export const Expr = constructors<Expr>()

const whitespace = P.regex(/\s*/)
const consumeWhitespace = <A>(p: P.Parser<A>): P.Parser<A> => P.between(whitespace, p, whitespace)

const identifierParser = P.regex(/^[a-z][a-z0-9]+/i)
const identifierExprParser = P.map(identifierParser, ident => Expr.Identifier(ident))

const callParser = P.map(P.zip2(
  consumeWhitespace(identifierParser),
  P.between(P.string('('), consumeWhitespace(identifierParser), P.string(')')),
), ([name, rest]) => Expr.Call({ name, args: [Expr.Identifier(rest)] }))

const exprParser: P.Parser<Expr> = P.or([
  callParser,
  identifierExprParser,
])

export const parse = (input: string): Expr => {
  const res = exprParser(input.trim());
  return match(res, {
    Ok: ({ value }) => value,
    Err: ({ error, input }) => {
      throw new Error(`${error}.\n Left input: ${input.slice(0, 20)}...`)
    },
  })
}

