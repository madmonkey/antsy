<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  countApproved, deleteOwn, getProfile, getReader, listApproved, onReaderChange, postComment, registerWithEmail,
  renderCaptcha, saveDisplayName, signInWith, signInWithEmail, signOut, type ReaderState
} from '~/composables/useComments'
import type { Comment } from '~/types'
import { MAX_COMMENT } from '~/utils/comments'

const props = defineProps<{ articleId: string, enabled: boolean }>()

const draftKey = `comment-draft:${props.articleId}`
const siteKey = String(useRuntimeConfig().public.turnstileSiteKey || '')

const count = ref<number | null>(null)
const open = ref(false)
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const comments = ref<Comment[]>([])
const reader = ref<ReaderState>({ status: 'signed-out' })
const profileName = ref<string | null>(null)
const nameInput = ref('')
const text = ref('')
const message = ref('')
const messageIsError = ref(false)
const emailMode = ref(false)
const register = ref(false)
const email = ref('')
const password = ref('')
const captchaEl = ref<HTMLElement | null>(null)
const captchaToken = ref('')
let stop: (() => void) | undefined

const userId = computed(() => (reader.value.status === 'verified' ? reader.value.userId : ''))
const label = computed(() => (count.value === null ? 'Comments' : `Comments (${count.value})`))

function say(m: string, isError = false) {
  message.value = m
  messageIsError.value = isError
}

async function loadList() {
  status.value = 'loading'
  try {
    comments.value = await listApproved(props.articleId)
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
}

async function loadProfile() {
  profileName.value = null
  if (!userId.value) return
  try {
    profileName.value = (await getProfile(userId.value))?.display_name ?? null
  } catch {
    say('Your profile could not be loaded. Try again.', true)
  }
}

async function toggle() {
  open.value = !open.value
  if (open.value && status.value !== 'ready') await loadList()
}

onMounted(async () => {
  const start = async () => {
    count.value = await countApproved(props.articleId)
    reader.value = await getReader()
    await loadProfile()
    stop = await onReaderChange(async (s) => {
      reader.value = s
      await loadProfile()
    })
    const saved = sessionStorage.getItem(draftKey)
    if (saved !== null) {
      text.value = saved
      sessionStorage.removeItem(draftKey)
      if (saved && reader.value.status === 'verified') await toggle()
    }
  }
  if (typeof onNuxtReady === 'function') onNuxtReady(start)
  else await start()
})
onBeforeUnmount(() => stop?.())

function keepDraft() {
  if (text.value.trim()) sessionStorage.setItem(draftKey, text.value)
}

async function oauth(provider: 'google' | 'github') {
  keepDraft()
  const err = await signInWith(provider, window.location.href.split('#')[0]!)
  if (err) say(err, true)
}

async function openEmail() {
  emailMode.value = true
  if (!siteKey) return
  await new Promise(r => setTimeout(r, 0))
  try {
    if (captchaEl.value) await renderCaptcha(captchaEl.value, siteKey, (t) => { captchaToken.value = t })
  } catch {
    say('The security check could not load. Try again.', true)
  }
}

async function submitEmail() {
  say('')
  if (siteKey && !captchaToken.value) return say('Complete the security check first.', true)
  if (register.value) {
    const err = await registerWithEmail(email.value, password.value, window.location.href.split('#')[0]!, captchaToken.value)
    return err ? say(err, true) : say('Check your email to confirm your account.')
  }
  const err = await signInWithEmail(email.value, password.value, captchaToken.value)
  if (err) return say(err, true)
  emailMode.value = false
}

async function saveName() {
  const err = await saveDisplayName(userId.value, nameInput.value)
  if (err) return say(err, true)
  say('')
  await loadProfile()
}

async function submit() {
  say('')
  const err = await postComment(props.articleId, userId.value, text.value)
  if (err) return say(err, true)
  text.value = ''
  say('Thanks. Your comment will appear after it has been approved.')
  await loadList()
}

async function remove(c: Comment) {
  const err = await deleteOwn(c.id)
  if (err) return say(err, true)
  comments.value = comments.value.filter(x => x.id !== c.id)
  count.value = await countApproved(props.articleId)
}

async function leave() {
  await signOut()
  say('')
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US')
</script>

<template>
  <section class="mt-8 border-t border-default pt-4" aria-labelledby="comments-heading">
    <h2 id="comments-heading" class="text-lg font-semibold">
      <button type="button" class="underline" :aria-expanded="open" aria-controls="comments-panel" data-test="comments-toggle" @click="toggle">
        {{ label }}
      </button>
    </h2>
    <div v-if="open" id="comments-panel" class="mt-3 space-y-4">
      <p v-if="status === 'loading'">
        Loading comments…
      </p>
      <p v-else-if="status === 'error'" role="alert" class="text-error">
        Comments are unavailable right now. <button type="button" class="underline" @click="loadList">Try again</button>
      </p>
      <template v-else>
        <p v-if="!comments.length" data-test="comments-empty">
          No comments yet.
        </p>
        <ul v-else class="space-y-3">
          <li v-for="c in comments" :key="c.id" data-test="comment" class="rounded border border-default p-3">
            <p class="text-sm text-muted">
              {{ c.author_name }} · {{ formatDate(c.created_at) }}
              <span v-if="c.status === 'pending'" class="ml-1 rounded bg-elevated px-1">awaiting approval</span>
            </p>
            <p class="whitespace-pre-line">
              {{ c.body }}
            </p>
            <button v-if="c.user_id && c.user_id === userId" type="button" class="text-sm underline" data-test="delete-own" @click="remove(c)">
              Delete
            </button>
          </li>
        </ul>
      </template>

      <p v-if="!enabled" data-test="comments-closed">
        Commenting is closed on this article.
      </p>
      <div v-else class="space-y-3">
        <template v-if="reader.status === 'signed-out'">
          <p>Sign in to add a comment. Comments are shown after approval.</p>
          <div class="flex flex-wrap gap-2">
            <UButton label="Continue with Google" variant="outline" data-test="signin-google" @click="oauth('google')" />
            <UButton label="Continue with GitHub" variant="outline" data-test="signin-github" @click="oauth('github')" />
            <UButton v-if="!emailMode" label="Use email instead" variant="ghost" data-test="signin-email" @click="openEmail" />
          </div>
          <form v-if="emailMode" class="space-y-2" @submit.prevent="submitEmail">
            <label class="block">Email
              <input v-model="email" type="email" required autocomplete="email" class="block w-full rounded border border-default bg-transparent p-1">
            </label>
            <label class="block">Password
              <input v-model="password" type="password" required minlength="8" :autocomplete="register ? 'new-password' : 'current-password'" class="block w-full rounded border border-default bg-transparent p-1">
            </label>
            <div ref="captchaEl" />
            <div class="flex items-center gap-3">
              <UButton type="submit" :label="register ? 'Create account' : 'Sign in'" />
              <button type="button" class="text-sm underline" @click="register = !register">
                {{ register ? 'I already have an account' : 'Create an account' }}
              </button>
            </div>
          </form>
        </template>

        <p v-else-if="reader.status === 'unconfirmed'" data-test="confirm-email">
          Confirm your email to comment. We sent a link to {{ reader.email }}.
          <button type="button" class="underline" @click="leave">Sign out</button>
        </p>

        <form v-else-if="profileName === null" class="space-y-2" data-test="name-form" @submit.prevent="saveName">
          <label class="block">Choose a display name (2-40 characters)
            <input v-model="nameInput" maxlength="40" class="block w-full rounded border border-default bg-transparent p-1">
          </label>
          <UButton type="submit" label="Save name" />
        </form>

        <form v-else class="space-y-2" data-test="comment-form" @submit.prevent="submit">
          <label class="block">Add a comment as {{ profileName }}
            <textarea v-model="text" rows="4" :maxlength="MAX_COMMENT" class="block w-full rounded border border-default bg-transparent p-1" />
          </label>
          <p class="text-sm text-muted">
            {{ text.length }} / {{ MAX_COMMENT }}
          </p>
          <div class="flex items-center gap-3">
            <UButton type="submit" label="Post comment" />
            <button type="button" class="text-sm underline" data-test="signout" @click="leave">
              Sign out
            </button>
          </div>
        </form>
        <p v-if="message" :role="messageIsError ? 'alert' : 'status'" aria-live="polite" :class="messageIsError ? 'text-error' : ''" data-test="comments-message">
          {{ message }}
        </p>
      </div>
    </div>
  </section>
</template>
