import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TagChips from '~/components/TagChips.vue'

const stubs = { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } }

describe('TagChips', () => {
  it('renders nothing for an empty list', () => {
    expect(mount(TagChips, { props: { tags: [] }, global: { stubs } }).find('ul').exists()).toBe(false)
  })
  it('links encode special characters and all tags render', () => {
    const w = mount(TagChips, { props: { tags: ['a&b', 'c d', 'e'] }, global: { stubs } })
    const hrefs = w.findAll('a').map(a => a.attributes('href'))
    expect(hrefs).toEqual(['/search?tag=a%26b', '/search?tag=c%20d', '/search?tag=e'])
  })
})
