type TagValue<T, N> = T extends Tag<N, infer V> ? V : never

export const match = <R, T extends Tag<string, any>>(
  tag: T,
  pattern: {
    [key in T['tag'] | '_']?: (v: TagValue<T, key>) => R
  },
): R => ((pattern as any)[tag.tag] || (pattern._ as any))(tag.value)

// type TagValues<
//   T extends Tag<any, string>,
//   Keys extends Array<string>,
//   Values extends Array<any> = [],
// > = Keys extends []
//   ? Values
//   : Keys extends [
//       infer key extends string,
//       ...infer restOfKeys extends string[],
//     ]
//   ? TagValues<T, restOfKeys, [...Values, TagValue<T, key>]>
//   : never
//
// export const ifLet = <T extends Tag<string, any>, Keys extends Array<T['tag']>>(
//   tag: T,
//   kinds: Keys,
//   cb: (...values: TagValues<T, Keys>) => void,
// ): void => {
//   const values = kinds.map(k => (tag.tag === k ? tag.value : undefined))
//   ;(cb as any)(...values)
// }

export const matchString = <R, T extends string = string>(
  key: T,
  pattern: {
    [key in T | '_']?: (key: key) => R
  },
): R => ((pattern as any)[key] || (pattern._ as any))(key)

type Tag<N, V> = { tag: N; value: V }
export type Enum<T> = { [N in keyof T]: Tag<N, T[N]> }[keyof T]

export const constructors = <T extends Tag<string, any>>(): {
  [N in T['tag']]: TagValue<T, N> extends null | never
    ? (value?: null | never) => T
    : (value: TagValue<T, N>) => T
} =>
  new Proxy(
    {},
    {
      get(_, k) {
        return (value: any) => ({ tag: k, value })
      },
    },
  ) as any
