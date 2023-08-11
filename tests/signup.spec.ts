import {
  fireEvent,
  waitFor,
  getByText,
  getByTestId,
} from '@testing-library/dom'
import { readFile } from 'node:fs/promises'
import '@testing-library/jest-dom'

import { render } from '../src/renderer'

async function loadFixture(type: string) {
  document.documentElement.innerHTML = await readFile(
    `./tests/fixtures/${type}/index.html`,
    'utf8',
  )
  await render({ root: document.body })
}

const delay = (delayMs: number) => new Promise(res => setTimeout(res, delayMs))

describe('signup example', () => {
  beforeEach(async () => {
    await loadFixture('signup')
    window.fetch = jest.fn() as any
  })

  it('should show form when button is clicked', async () => {
    const $showFormBtn = document.getElementById('show-form-btn')!
    const $form = document.getElementById('signup-form')!

    expect($showFormBtn).toBeVisible()
    expect($showFormBtn.nodeName).toBe('BUTTON')
    expect($form).not.toBeVisible()
    expect($form.nodeName).toBe('FORM')

    // Click and wait for button to get active class (handles delay)
    fireEvent.click($showFormBtn)
    await waitFor(() =>
      expect($showFormBtn.classList.contains('active')).toBe(true),
    )

    expect($form).toBeVisible()
  })

  describe('Form submit', () => {
    beforeEach(async () => {
      const $showFormBtn = document.getElementById('show-form-btn')!
      fireEvent.click($showFormBtn)
      await waitFor(() =>
        expect($showFormBtn.classList.contains('active')).toBe(true),
      )
      const $form = document.getElementById('signup-form')!
      expect($form).toBeVisible()
      await delay(100) // Wait for mounting
    })

    it('should submit form correctly', async () => {
      const $form = document.getElementById('signup-form')!

      // Set email and password field
      const $email = getByTestId<HTMLInputElement>(document.body, 'email')
      $email.value = 'no-reply@we-love-replies.com'
      const $password = getByTestId<HTMLInputElement>(document.body, 'password')
      $password.value = 'password'

      // Submit form
      const $submitBtn = getByText(document.body, 'Submit')
      fireEvent.click($submitBtn)

      // Should add submitting class to form
      await waitFor(() =>
        expect($form.classList.contains('submitting')).toBe(true),
      )

      // Should add submitted class to form and remove submitting
      await waitFor(() =>
        expect($form.classList.contains('submitted')).toBe(true),
      )
      expect($form.classList.contains('submitting')).toBe(false)

      // Should have made a request to post form data
      expect(window.fetch).toHaveBeenCalledTimes(1)
      const [url, { method, body }] = (window.fetch as any).mock.calls[0]
      expect(url).toBe('http://example.com/submit/api')
      expect(method).toBe('POST')
      expect(Object.fromEntries(body.entries())).toEqual({
        email: 'no-reply@we-love-replies.com',
        password: 'password',
      })
    })
  })
})
