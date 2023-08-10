import { Expr, parse } from '../src/parse-expr'

describe('parser', () => {
  it('should parse function call', () => {
    expect(parse('hello()')).toEqual([Expr.Call({ name: 'hello', args: [] })])
    expect(parse('hello ( wow , foo ) ')).toEqual([
      Expr.Call({
        name: 'hello',
        args: [Expr.Identifier('wow'), Expr.Identifier('foo')],
      }),
    ])
    expect(parse('hello(wow,foo)')).toEqual([
      Expr.Call({
        name: 'hello',
        args: [Expr.Identifier('wow'), Expr.Identifier('foo')],
      }),
    ])
    expect(parse('hello(wow,foo, coolio)')).toEqual([
      Expr.Call({
        name: 'hello',
        args: [
          Expr.Identifier('wow'),
          Expr.Identifier('foo'),
          Expr.Identifier('coolio'),
        ],
      }),
    ])
    expect(parse('hello(wow)')).toEqual([
      Expr.Call({ name: 'hello', args: [Expr.Identifier('wow')] }),
    ])
  })

  it('should parse sequential function calls', () => {
    expect(parse('hello(world) foo-doo(bar, baz)')).toEqual([
      Expr.Call({
        name: 'hello',
        args: [Expr.Identifier('world')],
      }),
      Expr.Call({
        name: 'foo-doo',
        args: [Expr.Identifier('bar'), Expr.Identifier('baz')],
      }),
    ])
  })
})
