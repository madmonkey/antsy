import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MarkdownEditor from '../../app/components/MarkdownEditor.vue'

const UButton = { template: '<button><slot /></button>' }
const img = { id: 1, dataUri: 'data:image/png;base64,iVBORw0KGgo=', bytes: 8 }

const mountEditor = (modelValue: string, images = [] as typeof img[]) =>
  mount(MarkdownEditor, { props: { modelValue, images }, global: { stubs: { UButton } } })

describe('MarkdownEditor preview', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('updates the preview 300 ms after the last change', async () => {
    const w = mountEditor('# One')
    expect(w.get('[data-test=editor-preview]').html()).toContain('One')
    await w.setProps({ modelValue: '# Two' })
    await vi.advanceTimersByTimeAsync(299)
    expect(w.get('[data-test=editor-preview]').html()).toContain('One')
    await vi.advanceTimersByTimeAsync(1)
    expect(w.get('[data-test=editor-preview]').html()).toContain('Two')
  })

  it('shows embedded images only through the validated data URI', async () => {
    const w = mountEditor('![a](embedded:1)', [img])
    expect(w.get('[data-test=editor-preview]').html()).toContain(img.dataUri)
    await w.setProps({ modelValue: '![a](embedded:2) <script>x</script>' })
    await vi.advanceTimersByTimeAsync(300)
    const html = w.get('[data-test=editor-preview]').html()
    expect(html).not.toContain('embedded:')
    expect(html).not.toContain('<script')
  })

  it('stays fast with a 5 MB image set', async () => {
    const big = { id: 1, dataUri: `data:image/png;base64,${'A'.repeat(6_700_000)}`, bytes: 5_000_000 }
    const w = mountEditor('![a](embedded:1)', [big])
    const t = performance.now()
    await w.setProps({ modelValue: '![a](embedded:1) more' })
    await vi.advanceTimersByTimeAsync(300)
    expect(performance.now() - t).toBeLessThan(1000)
  })
})
