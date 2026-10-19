import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import SiteHeader from '../../app/components/SiteHeader.vue'
import SocialLinks from '../../app/components/SocialLinks.vue'
import ThemeToggle from '../../app/components/ThemeToggle.vue'

const mode = { value: 'light', preference: 'system' }
const avatar = ref('')
const { isAdmin } = vi.hoisted(() => ({ isAdmin: vi.fn() }))
const social = ref([
  { platform: 'github', label: 'GitHub', url: 'https://github.com/x' },
  { platform: 'bluesky', label: 'Bluesky', url: 'https://bsky.app/' }
])

vi.stubGlobal('useColorMode', () => mode)
vi.stubGlobal('useAppConfig', () => ({ site: { name: 'Antsy Tek', get avatar() { return avatar.value }, get social() { return social.value } } }))
vi.mock('~/composables/useAdminSession', () => ({ useAdminSession: () => ({ isAdmin }) }))

const UButton = { props: ['ariaLabel'], template: '<button :aria-label="ariaLabel" @click="$emit(\'click\')"><slot /></button>' }
const stubs = { ClientOnly: { template: '<div><slot /></div>' }, UButton, UIcon: true, NuxtLink: { template: '<a><slot /></a>' }, ThemeToggle, SocialLinks }

describe('ThemeToggle', () => {
  beforeEach(() => { mode.value = 'light'; mode.preference = 'system' })

  it('offers night mode in day mode and day mode in night mode, and stores the choice', async () => {
    const w = mount(ThemeToggle, { global: { stubs: { UButton, ClientOnly: { template: '<div><slot /></div>' } } } })
    expect(w.get('button').attributes('aria-label')).toBe('Switch to night mode')
    await w.get('button').trigger('click')
    expect(mode.preference).toBe('dark')
    mode.value = 'dark'
    const w2 = mount(ThemeToggle, { global: { stubs: { UButton, ClientOnly: { template: '<div><slot /></div>' } } } })
    expect(w2.get('button').attributes('aria-label')).toBe('Switch to day mode')
    await w2.get('button').trigger('click')
    expect(mode.preference).toBe('light')
  })
})

describe('SiteHeader', () => {
  beforeEach(() => { isAdmin.mockReset().mockResolvedValue(false) })

  it('keeps social links out of the header and shows the toggle', () => {
    social.value = [{ platform: 'github', label: 'GitHub', url: 'https://github.com/x' }]
    const w = mount(SiteHeader, { global: { stubs } })
    expect(w.find('[data-test=social-links]').exists()).toBe(false)
    expect(w.find('[data-test=theme-toggle]').exists() || w.find('button').exists()).toBe(true)
  })

  it('renders only the toggle when there are no social links', () => {
    social.value = []
    const w = mount(SiteHeader, { global: { stubs } })
    expect(w.find('[data-test=social-links]').exists()).toBe(false)
    expect(w.findAll('button')).toHaveLength(1)
  })

  it('renders avatar with async decoding when configured', () => {
    avatar.value = '/avatar.webp'
    const w = mount(SiteHeader, { global: { stubs } })
    const img = w.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/avatar.webp')
    expect(img.attributes('decoding')).toBe('async')
    expect(img.attributes('width')).toBe('32')
    expect(img.attributes('height')).toBe('32')
    avatar.value = ''
  })

  it('shows a green ring only when the signed-in user is an admin', async () => {
    avatar.value = '/avatar.webp'
    isAdmin.mockResolvedValueOnce(true)
    const w = mount(SiteHeader, { global: { stubs } })
    await flushPromises()
    expect(w.find('img').classes()).toContain('ring-green-500')
    expect(w.text()).toContain('Admin session active')
    avatar.value = ''
  })

  it('does not show the admin indicator to public visitors', async () => {
    avatar.value = '/avatar.webp'
    const w = mount(SiteHeader, { global: { stubs } })
    await flushPromises()
    expect(w.find('img').classes()).not.toContain('ring-green-500')
    expect(w.text()).not.toContain('Admin session active')
    avatar.value = ''
  })
})
