import { Enum, constructors, match } from './adt';

export type Result<V, E> = Enum<{ Ok: V, Err: E }>
export const Result = constructors<Result<any, any>>()

export const mapResult = <A, B, E>(res: Result<A, E>, fn: (_: A) => B): Result<B, E> =>
  chainResult(res, a => Result.Ok(fn(a)))

export const chainResult = <A, B, E>(res: Result<A, E>, fn: (_: A) => Result<B, E>): Result<B, E> =>
  match(res, {
    Ok: a => fn(a),
    Err: e => Result.Err(e),
  });

export type ParseResult<T> = Result<{ value: T, input: string }, { error: string, input: string }>;

export type Parser<T> = (input: string) => ParseResult<T>;

export const regex = (re: RegExp): Parser<string> => input => {
  if (input.length === 0) return Result.Err({ error: 'fuckedinput', input })
  const res = input.match(re)
  if (!res) return Result.Err({ error: 'fucked', input });
  return Result.Ok({ value: res[0], input: input.replace(re, '') });
}

export const string = (str: string): Parser<string> => input => {
  if (input.length === 0) return Result.Err({ error: 'fuckedinput', input })
  if (!input.startsWith(str)) return Result.Err({ error: 'fuckedstring', input })
  return Result.Ok({ value: str, input: input.slice(str.length) });
}

export const or = <T>([parser, ...rest]: Array<Parser<T>>): Parser<T> => input => {
  if (rest.length === 0) return parser(input);
  const result = parser(input)
  return match(result, {
    Ok: () => result,
    Err: (_) => or(rest)(input),
  });
}

export const mapParseResult = <T, R>(parser: Parser<T>, fn: (_: { value: T, input: string }) => { value: R, input: string }): Parser<R> => input =>
  mapResult(parser(input), fn)

export const map = <T, R>(parser: Parser<T>, fn: (_: T) => R): Parser<R> =>
  mapParseResult(parser, ({ value, ...rest }) => ({ ...rest, value: fn(value) }));

export const zip2 = <A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<readonly [A, B]> => input => {
  // TODO: refactor please. shit code
  const resa: Result<{ value: A, input: string }, { error: string, input: string }> = parserA(input);
  return chainResult(resa, ({ value: a, input: inputB }) => {
    const res: Result<{ value: readonly [A, B], input: string }, { error: string, input: string }> =
      map(parserB, (b) => [a, b] as const)(inputB)
    return res
  })
}

export const prefixed = <A>(parserPrefix: Parser<any>, parser: Parser<A>): Parser<A> =>
  map(zip2(parserPrefix, parser), ([_, a]) => a);

export const suffixed = <A>(parser: Parser<A>, parserSuffix: Parser<any>): Parser<A> =>
  map(zip2(parser, parserSuffix), ([a, _]) => a);

export const between = <A>(prefix: Parser<any>, parser: Parser<A>, suffix: Parser<any>): Parser<A> =>
  suffixed(prefixed(prefix, parser), suffix)

export const many0 = <A>(parser: Parser<A>): Parser<Array<A>> => originalInput =>
  match(parser(originalInput), {
    Ok: ({ value, input }) => map(many0(parser), ls => [value, ...ls])(input),
    Err: ({ input }) => Result.Ok({ value: [], input }),
  })

export const many1 = <A>(parser: Parser<A>): Parser<Array<A>> => originalInput =>
  match(parser(originalInput), {
    Ok: ({ value, input }) => map(many0(parser), ls => [value, ...ls])(input),
    Err: err => Result.Err(err),
  })

export const sepBy = <A>(parser: Parser<A>, sepP: Parser<any>): Parser<Array<A>> => originalInput =>
  match(parser(originalInput), {
    Ok: ({ value, input }) => map(
      many0(prefixed(sepP, parser)),
      ls => [value, ...ls]
    )(input),
    Err: _ => Result.Ok({ value: [], input: originalInput }),
  })

