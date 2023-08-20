import { EvalActions, EvalValue, evalExpr } from '../src/eval'
import { Expr, parseExpr } from '../src/parser'

describe('eval', () => {
  const deps: EvalActions = {
    addClass: jest.fn(),
    removeClass: jest.fn(),
    delay: jest.fn(),
    jsEval: jest.fn(),
    loadCssx: jest.fn(),
    getVariable: jest.fn(),
    updateVariable: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    withEvent: jest.fn(),
    getFormData: jest.fn(),
    sendRequest: jest.fn(),
    addChildren: jest.fn(),
    removeElement: jest.fn(),
    callMethod: jest.fn(),
    evaluateInScope: jest.fn(),
  }

  fdescribe('function/call', () => {
    it('should declare function correctly', async () => {
      const evalValue = await evalExpr(
        parseExpr(`func(if(get-var(--bool), 'false', 'true'))`),
        deps,
      )
      expect(evalValue).toEqual(
        EvalValue.Lazy([
          Expr.Call({
            name: 'if',
            args: [
              Expr.Call({
                name: 'get-var',
                args: [Expr.VarIdentifier('--bool')],
              }),
              Expr.LiteralString('false'),
              Expr.LiteralString('true'),
            ],
          }),
        ]),
      )
    })

    it('should allow multiple expressions in func', async () => {
      const evalValue = await evalExpr(
        parseExpr(`func(
          update(--some-var, 'hello world'),
          if(get-var(--bool), 'false', 'true')
        )`),
        deps,
      )
      expect(evalValue).toEqual(
        EvalValue.Lazy([
          Expr.Call({
            name: 'update',
            args: [
              Expr.VarIdentifier('--some-var'),
              Expr.LiteralString('hello world'),
            ],
          }),
          Expr.Call({
            name: 'if',
            args: [
              Expr.Call({
                name: 'get-var',
                args: [Expr.VarIdentifier('--bool')],
              }),
              Expr.LiteralString('false'),
              Expr.LiteralString('true'),
            ],
          }),
        ]),
      )
    })
  })

  it('should add classes', async () => {
    await evalExpr(
      Expr.Call({
        name: 'add-class',
        args: [Expr.Identifier('element-id'), Expr.LiteralString('class-name')],
      }),
      deps,
    )

    expect(deps.addClass).toHaveBeenCalledTimes(1)
    expect(deps.addClass).toHaveBeenCalledWith('element-id', 'class-name')
  })

  it('should allow conditionals classes', async () => {
    expect(
      await evalExpr(
        Expr.Call({
          name: 'if',
          args: [
            Expr.Identifier('true'),
            Expr.Identifier('yes'),
            Expr.Identifier('no'),
          ],
        }),
        deps,
      ),
    ).toBe('yes')

    expect(
      await evalExpr(
        Expr.Call({
          name: 'if',
          args: [
            Expr.Identifier('false'),
            Expr.Identifier('yes'),
            Expr.Identifier('no'),
          ],
        }),
        deps,
      ),
    ).toBe('no')

    expect(
      await evalExpr(
        Expr.Call({
          name: 'if',
          args: [
            Expr.Identifier('0'),
            Expr.Identifier('yes'),
            Expr.Identifier('no'),
          ],
        }),
        deps,
      ),
    ).toBe('no')
  })

  it('should remove classes', async () => {
    await evalExpr(
      Expr.Call({
        name: 'remove-class',
        args: [Expr.Identifier('element-id'), Expr.LiteralString('class-name')],
      }),
      deps,
    )

    expect(deps.removeClass).toHaveBeenCalledTimes(1)
    expect(deps.removeClass).toHaveBeenCalledWith('element-id', 'class-name')
  })

  it('should add a delay', async () => {
    await evalExpr(
      Expr.Call({
        name: 'delay',
        args: [Expr.LiteralString('200')],
      }),
      deps,
    )

    expect(deps.delay).toHaveBeenCalledTimes(1)
    expect(deps.delay).toHaveBeenCalledWith(200)
  })

  it('should get variable', async () => {
    await evalExpr(
      Expr.Call({
        name: 'var',
        args: [Expr.LiteralString('--my-var'), Expr.LiteralString('def value')],
      }),
      deps,
    )

    expect(deps.getVariable).toHaveBeenCalledTimes(1)
    expect(deps.getVariable).toHaveBeenCalledWith('--my-var')
  })
})
