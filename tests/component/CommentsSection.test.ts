import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommentsSection from '../../app/components/CommentsSection.vue'

const m = vi.hoisted(() => ({
  countApproved: vi.fn(), listApproved: vi.fn(), getReader: vi.fn(), onReaderChange: vi.fn(), getProfile: vi.fn(),
  postComment: vi.fn(), deleteOwn: vi.fn(), signOut: vi.fn(), signInWith: vi.fn(), saveDisplayName: vi.fn(),
  registerWithEmail: vi.fn(), signInWithEmail: vi.fn(), renderCaptcha: vi.fn()
}))
vi.mock('~/composables/useComments', () => m)
vi.stubGlobal('useRuntimeConfig', () => ({ public: { turnstileSiteKey: '' } }))

const UButton = { props: ['label'], template: '<button type="button" @click="$emit(\'click\')">{{ label }}<slot /></button>' }
const UModal = { props: ['open'], template: '<div v-if="open"><slot name="body" /></div>' }
const mountIt = (enabled = true) => mount(CommentsSection, { props: { articleId: 'a1', enabled }, global: { stubs: { UButton, UModal, UIcon: true } } })
const comment = (o = {}) => ({ id: 'c1', author_name: 'Ann', body: 'hello', created_at: '2026-01-01T00:00:00Z', status: 'approved', user_id: 'u2', ...o })

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  m.countApproved.mockResolvedValue(2)
  m.listApproved.mockResolvedValue([comment()])
  m.getReader.mockResolvedValue({ status: 'signed-out' })
  m.onReaderChange.mockResolvedValue(() => {})
  m.getProfile.mockResolvedValue(null)
  m.postComment.mockResolvedValue(null)
  m.deleteOwn.mockResolvedValue(null)
  m.signOut.mockResolvedValue(undefined)
})

describe('CommentsSection', () => {
  it('is collapsed, shows the count and fetches no list until opened', async () => {
    const w = mountIt()
    await flushPromises()
    expect(w.get('[data-test=comments-toggle]').text()).toBe('Comments (2)')
    expect(m.listApproved).not.toHaveBeenCalled()
    await w.get('[data-test=comments-toggle]').trigger('click')
    await flushPromises()
    expect(m.listApproved).toHaveBeenCalledTimes(1)
    expect(w.findAll('[data-test=comment]')).toHaveLength(1)
  })

  it('shows empty and error states', async () => {
    m.listApproved.mockResolvedValueOnce([])
    const w = mountIt()
    await flushPromises()
    await w.get('[data-test=comments-toggle]').trigger('click')
    await flushPromises()
    expect(w.find('[data-test=comments-empty]').exists()).toBe(true)
    m.listApproved.mockRejectedValueOnce(new Error('x'))
    const e = mountIt()
    await flushPromises()
    await e.get('[data-test=comments-toggle]').trigger('click')
    await flushPromises()
    expect(e.text()).toContain('Comments are unavailable right now.')
  })

  it('renders markup in a comment as text', async () => {
    m.listApproved.mockResolvedValue([comment({ body: '<img src=x onerror=alert(1)>' })])
    const w = mountIt()
    await flushPromises()
    await w.get('[data-test=comments-toggle]').trigger('click')
    await flushPromises()
    expect(w.find('img').exists()).toBe(false)
    expect(w.text()).toContain('<img src=x')
  })

  it('closed state hides the form but keeps comments', async () => {
    const w = mountIt(false)
    await flushPromises()
    await w.get('[data-test=comments-toggle]').trigger('click')
    await flushPromises()
    expect(w.find('[data-test=comments-closed]').exists()).toBe(true)
    expect(w.find('[data-test=comment-form]').exists()).toBe(false)
    expect(w.find('[data-test=signin-google]').exists()).toBe(false)
    expect(w.findAll('[data-test=comment]')).toHaveLength(1)
  })

  it('signed-out opens a dialog with both providers and email, and no comment form', async () => {
    const w = mountIt()
    await flushPromises()
    await w.get('[data-test=comments-toggle]').trigger('click')
    await flushPromises()
    expect(w.find('[data-test=signin-google]').exists()).toBe(false)
    await w.get('[data-test=open-register]').trigger('click')
    expect(w.find('[data-test=signin-google]').exists()).toBe(true)
    expect(w.find('[data-test=signin-github]').exists()).toBe(true)
    expect(w.find('[data-test=signin-email]').exists()).toBe(true)
    expect(w.find('[data-test=comment-form]').exists()).toBe(false)
  })

  it('unconfirmed readers are asked to confirm their email', async () => {
    m.getReader.mockResolvedValue({ status: 'unconfirmed', email: 'a@b.c' })
    const w = mountIt()
    await flushPromises()
    await w.get('[data-test=comments-toggle]').trigger('click')
    await flushPromises()
    expect(w.find('[data-test=confirm-email]').exists()).toBe(true)
    expect(w.find('[data-test=comment-form]').exists()).toBe(false)
  })

  it('asks for a display name when there is no profile', async () => {
    m.getReader.mockResolvedValue({ status: 'verified', userId: 'u1' })
    const w = mountIt()
    await flushPromises()
    await w.get('[data-test=comments-toggle]').trigger('click')
    await flushPromises()
    expect(w.find('[data-test=name-form]').exists()).toBe(true)
  })

  describe('signed in with a name', () => {
    beforeEach(() => {
      m.getReader.mockResolvedValue({ status: 'verified', userId: 'u1' })
      m.getProfile.mockResolvedValue({ user_id: 'u1', display_name: 'Me', is_blocked: false })
    })
    const open = async () => {
      const w = mountIt()
      await flushPromises()
      await w.get('[data-test=comments-toggle]').trigger('click')
      await flushPromises()
      return w
    }

    it('shows the success message after submit', async () => {
      const w = await open()
      await w.get('textarea').setValue('nice')
      await w.get('[data-test=comment-form]').trigger('submit')
      await flushPromises()
      expect(m.postComment).toHaveBeenCalledWith('a1', 'u1', 'nice')
      expect(w.get('[data-test=comments-message]').text()).toBe('Thanks. Your comment will appear after it has been approved.')
    })

    it('shows a refusal message', async () => {
      m.postComment.mockResolvedValue('Too many comments. Try again shortly.')
      const w = await open()
      await w.get('[data-test=comment-form]').trigger('submit')
      await flushPromises()
      expect(w.get('[data-test=comments-message]').text()).toContain('Too many comments')
    })

    it('limits input length in the textarea', async () => {
      const w = await open()
      expect(w.get('textarea').attributes('maxlength')).toBe('2000')
    })

    it('offers delete only on own comments and sign out returns to signed out', async () => {
      m.listApproved.mockResolvedValue([comment({ id: 'mine', user_id: 'u1' }), comment({ id: 'theirs', user_id: 'u2' })])
      const w = await open()
      expect(w.findAll('[data-test=delete-own]')).toHaveLength(1)
      await w.get('[data-test=delete-own]').trigger('click')
      await flushPromises()
      expect(m.deleteOwn).toHaveBeenCalledWith('mine')
      await w.get('[data-test=signout]').trigger('click')
      expect(m.signOut).toHaveBeenCalled()
    })
  })
})
