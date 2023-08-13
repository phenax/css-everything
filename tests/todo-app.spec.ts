import { getByTestId, prettyDOM } from '@testing-library/dom'
import '@testing-library/jest-dom'
import { delay, loadHTMLFixture } from './util'

describe('todo-app example', () => {
  describe('Add new task', () => {
    beforeAll(async () => {
      await loadHTMLFixture('todo-app')
    })

    it('should add new unchecked task', async () => {
      const $textInput = getByTestId<HTMLInputElement>(
        document.body,
        'add-task-input',
      )
      $textInput.value = 'Buy Milk'

      const $addBtn = getByTestId<HTMLButtonElement>(
        document.body,
        'add-task-btn',
      )
      $addBtn.click()

      await delay(100)

      console.log(prettyDOM(document.body))
      console.log()
      console.log()
      console.log()
      console.log()
    })
  })
})
