import { Enum, constructors, match } from "./adt";

export type Result<V, E> = Enum<{ Ok: V, Err: E }>
export const Result = constructors<Result<any, any>>()

export const mapResult = <A, B, E>(res: Result<A, E>, fn: (_: A) => B): Result<B, E> =>
  chainResult(res, a => Result.Ok(fn(a)))

export const chainResult = <A, B, E>(res: Result<A, E>, fn: (_: A) => Result<B, E>): Result<B, E> =>
  match(res, {
    Ok: a => fn(a),
    Err: e => Result.Err(e),
  });

