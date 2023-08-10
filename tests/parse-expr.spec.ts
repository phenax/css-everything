import { parse } from '../src/parse-expr'
import * as P from '../src/utils/parser-comb'

describe('parser', () => {
  it('should die', () => {
    const res = parse('hello(test)')
    expect(res).toEqual(['hello', '(test, 1)'])
  })
})
