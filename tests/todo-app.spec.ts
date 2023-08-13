import { getByTestId, prettyDOM } from '@testing-library/dom'
import '@testing-library/jest-dom'
import { delay, loadHTMLFixture } from './util'

describe('todo-app example', () => {
  describe('Add new task', () => {
    let $textInput: HTMLInputElement
    let $addBtn: HTMLButtonElement

    let $taskItems: Array<HTMLElement> = []

    const submit = async (text: string) => {
      $textInput.value = text
      $addBtn.click()

      await delay(100)
      $taskItems = [
        ...document.querySelectorAll<HTMLElement>(
          '[data-instance="task-item"]',
        ),
      ]
    }

    beforeAll(async () => {
      await loadHTMLFixture('todo-app')

      $textInput = getByTestId<HTMLInputElement>(
        document.body,
        'add-task-input',
      )
      $addBtn = getByTestId<HTMLButtonElement>(document.body, 'add-task-btn')
    })

    it('should add new unchecked task', async () => {
      // Add first item
      await submit('Buy Milk')
      expect($taskItems).toHaveLength(1)
      expect(getComputedStyle($taskItems[0]).getPropertyValue('--text')).toBe(
        'Buy Milk',
      )

      // Add the second item
      await submit('Kill all the non-believers')
      expect($taskItems).toHaveLength(2)
      expect(getComputedStyle($taskItems[0]).getPropertyValue('--text')).toBe(
        'Buy Milk',
      )
      expect(getComputedStyle($taskItems[1]).getPropertyValue('--text')).toBe(
        'Kill all the non-believers',
      )
    })
  })
})
