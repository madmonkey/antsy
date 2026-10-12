import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import SiteHeader from '../../app/components/SiteHeader.vue'
import SocialLinks from '../../app/components/SocialLinks.vue'
import ThemeToggle from '../../app/components/ThemeToggle.vue'

const mode = { value: 'light', preference: 'system' }
const social = ref([
  { platform: 'github', label: 'GitHub', url: 'https://github.com/x' },
  { platform: 'bluesky', label: 'Bluesky', url: 'https://bsky.app/' }
])

vi.stubGlobal('useColorMode', () => mode)
vi.stubGlobal('useAppConfig', () => ({ site: { name: 'Antsy Tek', get social() { return social.value } } }))

const UButton = { props: ['ariaLabel'], template: '<button :aria-label="ariaLabel" @click="$emit(\'click\')"><slot /></button>' }
const stubs = { UButton, UIcon: true, NuxtLink: { template: '<a><slot /></a>' }, ThemeToggle, SocialLinks }

describe('ThemeToggle', () => {
  beforeEach(() => { mode.value = 'light'; mode.preference = 'system' })

  it('offers night mode in day mode and day mode in night mode, and stores the choice', async () => {
    const w = mount(ThemeToggle, { global: { stubs: { UButton } } })
    expect(w.get('button').attributes('aria-label')).toBe('Switch to night mode')
    await w.get('button').trigger('click')
    expect(mode.preference).toBe('dark')
    mode.value = 'dark'
    const w2 = mount(ThemeToggle, { global: { stubs: { UButton } } })
    expect(w2.get('button').attributes('aria-label')).toBe('Switch to day mode')
    await w2.get('button').trigger('click')
    expect(mode.preference).toBe('light')
  })
})

describe('SiteHeader', () => {
  it('renders safe, labelled social links and the toggle', () => {
    social.value = [{ platform: 'github', label: 'GitHub', url: 'https://github.com/x' }, { platform: 'bluesky', label: 'Bluesky', url: 'https://bsky.app/' }]
    const w = mount(SiteHeader, { global: { stubs } })
    const links = w.findAll('[data-test=social-links] a')
    expect(links).toHaveLength(2)
    for (const a of links) {
      expect(a.attributes('target')).toBe('_blank')
      expect(a.attributes('rel')).toBe('noopener noreferrer')
      expect(a.attributes('aria-label')).toBeTruthy()
    }
    expect(w.find('[data-test=theme-toggle]').exists() || w.find('button').exists()).toBe(true)
  })

  it('renders only the toggle when there are no social links', () => {
    social.value = []
    const w = mount(SiteHeader, { global: { stubs } })
    expect(w.find('[data-test=social-links]').exists()).toBe(false)
    expect(w.findAll('button')).toHaveLength(1)
  })
})
