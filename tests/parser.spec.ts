import { Expr, parse } from '../src/parser'

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

  it('should parse string literal', () => {
    expect(parse(`"hello world toodles \' nice single quote there"`)).toEqual([
      Expr.LiteralString(`hello world toodles \' nice single quote there`),
    ])

    expect(parse(` 'hello world toodles \" nice double quote there' `)).toEqual(
      [Expr.LiteralString(`hello world toodles \" nice double quote there`)]
    )
  })

  it('should parse var identifiers', () => {
    expect(parse(`var(--hello, 'default')`)).toEqual([
      Expr.Call({
        name: 'var',
        args: [Expr.VarIdentifier('--hello'), Expr.LiteralString(`default`)],
      }),
    ])

    expect(parse(`calc(var(--hello))`)).toEqual([
      Expr.Call({
        name: 'calc',
        args: [
          Expr.Call({
            name: 'var',
            args: [Expr.VarIdentifier('--hello')],
          }),
        ],
      }),
    ])
  })
})
