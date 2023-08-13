import { readFile } from 'node:fs/promises'
import { render } from '../src'

export async function loadHTMLFixture(type: string) {
  document.documentElement.innerHTML = await readFile(
    `./tests/fixtures/${type}/index.html`,
    'utf8',
  )
  await render({ root: document.body })
}

export const delay = (delayMs: number) =>
  new Promise(res => setTimeout(res, delayMs))
