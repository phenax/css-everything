import { Expr, SelectorComp, parse, parseDeclarations } from '../src/parser'

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
    expect(parse(`"hello world toodles ' nice single quote there"`)).toEqual([
      Expr.LiteralString(`hello world toodles ' nice single quote there`),
    ])

    expect(parse(` 'hello world toodles " nice double quote there' `)).toEqual([
      Expr.LiteralString(`hello world toodles " nice double quote there`),
    ])
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

    expect(parse(`update(state-container, --count, var(--count))`)).toEqual([
      Expr.Call({
        name: 'update',
        args: [
          Expr.Identifier('state-container'),
          Expr.VarIdentifier('--count'),
          Expr.Call({
            name: 'var',
            args: [Expr.VarIdentifier('--count')],
          }),
        ],
      }),
    ])
  })

  it('should parse number and css units', () => {
    expect(parse(`100`)).toEqual([Expr.LiteralNumber({ value: 100, unit: '' })])
    expect(parse(`100s`)).toEqual([
      Expr.LiteralNumber({ value: 100, unit: 's' }),
    ])
    expect(parse(`100ms`)).toEqual([
      Expr.LiteralNumber({ value: 100, unit: 'ms' }),
    ])
    expect(parse(`3.82`)).toEqual([
      Expr.LiteralNumber({ value: 3.82, unit: '' }),
    ])
    expect(parse(`3.82s`)).toEqual([
      Expr.LiteralNumber({ value: 3.82, unit: 's' }),
    ])
    expect(parse(`3.82ms`)).toEqual([
      Expr.LiteralNumber({ value: 3.82, unit: 'ms' }),
    ])
    expect(parse(`-100`)).toEqual([
      Expr.LiteralNumber({ value: -100, unit: '' }),
    ])
    expect(parse(`-100s`)).toEqual([
      Expr.LiteralNumber({ value: -100, unit: 's' }),
    ])
    expect(parse(`-100ms`)).toEqual([
      Expr.LiteralNumber({ value: -100, unit: 'ms' }),
    ])
    expect(parse(`-3.82`)).toEqual([
      Expr.LiteralNumber({ value: -3.82, unit: '' }),
    ])
    expect(parse(`-3.82s`)).toEqual([
      Expr.LiteralNumber({ value: -3.82, unit: 's' }),
    ])
    expect(parse(`-3.82ms`)).toEqual([
      Expr.LiteralNumber({ value: -3.82, unit: 'ms' }),
    ])
  })

  it('should parse pair and map expressions', () => {
    expect(parse(`--hello: "foobar is here"`)).toEqual([
      Expr.Pair({
        key: '--hello',
        value: Expr.LiteralString('foobar is here'),
      }),
    ])

    expect(
      parse(`map(--hello: "foobar is here", --test-var : var(--other-var))`),
    ).toEqual([
      Expr.Call({
        name: 'map',
        args: [
          Expr.Pair({
            key: '--hello',
            value: Expr.LiteralString('foobar is here'),
          }),
          Expr.Pair({
            key: '--test-var',
            value: Expr.Call({
              name: 'var',
              args: [Expr.VarIdentifier('--other-var')],
            }),
          }),
        ],
      }),
    ])
  })

  describe('parseDeclarations', () => {
    it('should parse complex selectors', () => {
      expect(
        parseDeclarations(`button#something.my-class[hello=world]`),
      ).toEqual([
        Expr.Selector({
          tag: 'button',
          id: 'something',
          selectors: [
            SelectorComp.ClassName('my-class'),
            SelectorComp.Attr(['hello', 'world']),
          ],
        }),
      ])

      expect(
        parseDeclarations(
          `#something[data-testid="hello world"].wow input#password[type=password][placeholder="Password: ***"]`,
        ),
      ).toEqual([
        Expr.Selector({
          tag: undefined,
          id: 'something',
          selectors: [
            SelectorComp.Attr(['data-testid', 'hello world']),
            SelectorComp.ClassName('wow'),
          ],
        }),
        Expr.Selector({
          tag: 'input',
          id: 'password',
          selectors: [
            SelectorComp.Attr(['type', 'password']),
            SelectorComp.Attr(['placeholder', 'Password: ***']),
          ],
        }),
      ])
    })

    it('should parse declarations', () => {
      expect(
        parseDeclarations(
          `instance(button#something, map(--text: "wow", --color: red))`,
        ),
      ).toEqual([
        Expr.Call({
          name: 'instance',
          args: [
            Expr.Selector({
              tag: 'button',
              id: 'something',
              selectors: [],
            }),
            Expr.Call({
              name: 'map',
              args: [
                Expr.Pair({ key: '--text', value: Expr.LiteralString('wow') }),
                Expr.Pair({ key: '--color', value: Expr.Identifier('red') }),
              ],
            }),
          ],
        }),
      ])
    })
  })
})
