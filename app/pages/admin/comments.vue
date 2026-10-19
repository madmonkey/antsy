<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  deleteComment, listBlockedUserIds, listCommentsForModeration, setCommenterBlocked, setCommentStatus,
  type ModerationComment
} from '~/composables/useAdminContent'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Comments', robots: 'noindex' })

const tabs = ['pending', 'approved', 'rejected'] as const
const tab = ref<ModerationComment['status']>('pending')
const rows = ref<ModerationComment[]>([])
const blocked = ref(new Set<string>())
const state = ref<'loading' | 'ready' | 'error'>('loading')
const error = ref('')

async function load() {
  state.value = 'loading'
  error.value = ''
  try {
    rows.value = await listCommentsForModeration(tab.value)
    blocked.value = await listBlockedUserIds([...new Set(rows.value.map(r => r.user_id))])
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}
onMounted(load)

async function pick(t: ModerationComment['status']) {
  tab.value = t
  await load()
}

async function run(action: () => Promise<string | null>) {
  error.value = (await action()) ?? ''
  if (!error.value) await load()
}

const approve = (c: ModerationComment) => run(() => setCommentStatus(c.id, 'approved'))
const reject = (c: ModerationComment) => run(() => setCommentStatus(c.id, 'rejected'))
const remove = (c: ModerationComment) => confirm('Delete this comment permanently?') ? run(() => deleteComment(c.id)) : undefined
const toggleBlock = (c: ModerationComment) => {
  const next = !blocked.value.has(c.user_id)
  if (next && !confirm(`Block ${c.author_name} from commenting?`)) return
  return run(() => setCommenterBlocked(c.user_id, next))
}
const formatDate = (iso: string) => new Date(iso).toLocaleString('en-US')
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">
      Comments
    </h1>
    <div class="flex gap-2" role="tablist">
      <UButton v-for="t in tabs" :key="t" :label="t" :variant="tab === t ? 'solid' : 'outline'" size="sm" role="tab" :aria-selected="tab === t" @click="pick(t)" />
    </div>
    <p v-if="error" role="alert" class="text-error">
      {{ error }}
    </p>
    <p v-if="state === 'loading'">
      Loading…
    </p>
    <p v-else-if="state === 'error'" role="alert" class="text-error">
      Comments could not be loaded. <UButton label="Retry" size="xs" @click="load" />
    </p>
    <template v-else>
      <p v-if="!rows.length">
        No {{ tab }} comments.
      </p>
      <ul class="space-y-3">
        <li v-for="c in rows" :key="c.id" class="space-y-1 rounded border border-default p-3" data-test="mod-comment">
          <p class="text-sm text-muted">
            {{ c.author_name }} · {{ formatDate(c.created_at) }} ·
            <NuxtLink v-if="c.article" :to="`/articles/${c.article.slug}`" class="underline">
              {{ c.article.title }}
            </NuxtLink>
          </p>
          <p class="whitespace-pre-line">
            {{ c.body }}
          </p>
          <div class="flex flex-wrap gap-2">
            <UButton v-if="c.status !== 'approved'" label="Approve" size="xs" @click="approve(c)" />
            <UButton v-if="c.status !== 'rejected'" label="Reject" size="xs" variant="outline" @click="reject(c)" />
            <UButton label="Delete" size="xs" variant="outline" color="error" @click="remove(c)" />
            <UButton :label="blocked.has(c.user_id) ? 'Unblock' : 'Block'" size="xs" variant="ghost" @click="toggleBlock(c)" />
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>
