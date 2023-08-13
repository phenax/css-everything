import { EvalActions, evalExpr } from '../src/eval'
import { Expr } from '../src/parser'

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
  }

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
