import { EvalActions, EvalValue, evalExpr } from '../src/eval'
import { parseExpr } from '../src/parser'
import { matchString } from '../src/utils/adt'

describe('calc', () => {
  const variables = (name: string) =>
    matchString(name, {
      '--test-8rem': () => '8rem',
      _: () => {},
    })
  const actions: EvalActions = {
    addClass: jest.fn(),
    removeClass: jest.fn(),
    delay: jest.fn(),
    jsEval: jest.fn(eval),
    loadCssx: jest.fn(),
    getVariable: jest.fn(variables),
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

  describe.each([
    ['calc(8rem)', EvalValue.Number(128)],
    ['calc(5 + 8)', EvalValue.Number(13)],
    ['calc(5 * 8 + 1)', EvalValue.Number(41)],
    ['calc(5 * (8 + 1))', EvalValue.Number(45)],
    ['calc(5px * (8rem + 1))', EvalValue.Number(645)],
    ['calc(5px * 8rem/2 + 1)', EvalValue.Number(321)],
    ['calc(var(--test-8rem))', EvalValue.Number(128)],
    ['calc(var(--test-1))', EvalValue.Number(0)], // Var not found
    ['calc(5px * var(--test-8rem)/2 + 1)', EvalValue.Number(321)],
    ['calc(js-eval("2 * 5"))', EvalValue.Number(10)],
    ['calc(9 * js-eval("2 * 5")/2 - 6)', EvalValue.Number(39)],
    ['calc(30 - 5 - 3)', EvalValue.Number(22)],
    ['calc(30 / 5 / 3)', EvalValue.Number(2)],
    ['calc(360 * 6/2 - 90 + 30)', EvalValue.Number(1020)],
    [
      'calc(360 * js-eval("18 / 3")/2 - 90 + (3 * js-eval("2 * 5")))',
      EvalValue.Number(1020),
    ],
  ])('when given "%s"', (expr, expected) => {
    it('should evaluate the result of math', async () => {
      const evalValue = await evalExpr(parseExpr(expr), actions)
      expect(evalValue).toEqual(expected)
    })
  })
})
