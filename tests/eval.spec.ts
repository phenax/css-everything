import { Dependencies, evalExpr } from '../src/eval'
import { Expr } from '../src/parser'

describe('eval', () => {
  const deps: Dependencies = {
    addClass: jest.fn(),
    removeClass: jest.fn(),
  }

  it('should add classes', async () => {
    await evalExpr(Expr.Call({
      name: 'add-class',
      args: [ Expr.Identifier('element-id'), Expr.LiteralString('class-name') ],
    }), deps)

    expect(deps.addClass).toHaveBeenCalledTimes(1)
    expect(deps.addClass).toHaveBeenCalledWith('element-id', 'class-name')
  })

  it('should add classes', async () => {
    await evalExpr(Expr.Call({
      name: 'remove-class',
      args: [ Expr.Identifier('element-id'), Expr.LiteralString('class-name') ],
    }), deps)

    expect(deps.removeClass).toHaveBeenCalledTimes(1)
    expect(deps.removeClass).toHaveBeenCalledWith('element-id', 'class-name')
  })
})
