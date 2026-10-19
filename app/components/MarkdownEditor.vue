<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  checkImage, nextImageId, toDataUri, totalBytes, type EmbeddedImage
} from '~/utils/embed-image'
import { renderPreview } from '~/utils/markdown'

const props = defineProps<{ modelValue: string, images: EmbeddedImage[], coverId?: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [string], 'update:images': [EmbeddedImage[]], 'update:coverId': [number | null] }>()

const area = ref<HTMLTextAreaElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const message = ref('')
const html = ref(renderPreview(props.modelValue, props.images))

let timer: ReturnType<typeof setTimeout> | undefined
watch(() => [props.modelValue, props.images], () => {
  clearTimeout(timer)
  timer = setTimeout(() => { html.value = renderPreview(props.modelValue, props.images) }, 300)
})
onBeforeUnmount(() => clearTimeout(timer))

const usedMb = computed(() => (totalBytes(props.images) / 1_000_000).toFixed(1))

function replaceSelection(make: (selected: string) => string) {
  const el = area.value
  const start = el?.selectionStart ?? props.modelValue.length
  const end = el?.selectionEnd ?? start
  const text = props.modelValue
  emit('update:modelValue', text.slice(0, start) + make(text.slice(start, end)) + text.slice(end))
}

const wrap = (mark: string) => replaceSelection(s => `${mark}${s || 'text'}${mark}`)
const prefix = (mark: string) => replaceSelection(s => `${mark}${s || 'text'}`)
const link = () => replaceSelection(s => `[${s || 'text'}](https://)`)

async function embed(files: File[]) {
  message.value = ''
  let images = props.images
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const result = checkImage(bytes, totalBytes(images))
    if (!result.ok) {
      message.value = result.message
      continue
    }
    const id = nextImageId(images)
    images = [...images, { id, dataUri: toDataUri(bytes, result.mime), bytes: bytes.length }]
    replaceSelection(() => `![${file.name.replace(/\.[^.]+$/, '')}](embedded:${id})`)
    emit('update:images', images)
  }
}

const onPick = (e: Event) => {
  const input = e.target as HTMLInputElement
  void embed([...(input.files ?? [])])
  input.value = ''
}
const onFiles = (e: ClipboardEvent | DragEvent) => {
  const files = [...((e as ClipboardEvent).clipboardData?.files ?? (e as DragEvent).dataTransfer?.files ?? [])]
  if (!files.length) return
  e.preventDefault()
  void embed(files)
}

const altOf = (id: number) => new RegExp(`!\\[([^\\]]*)\\]\\(embedded:${id}\\)`).exec(props.modelValue)?.[1] ?? ''
function setAlt(id: number, alt: string) {
  emit('update:modelValue', props.modelValue.replace(new RegExp(`!\\[[^\\]]*\\]\\(embedded:${id}\\)`, 'g'), `![${alt.replace(/[\][]/g, '')}](embedded:${id})`))
}
function remove(id: number) {
  emit('update:modelValue', props.modelValue.replace(new RegExp(`!\\[[^\\]]*\\]\\(embedded:${id}\\)`, 'g'), ''))
  emit('update:images', props.images.filter(i => i.id !== id))
}

function setStore(id: number, store: boolean) {
  emit('update:images', props.images.map(i => i.id === id ? { ...i, store } : i))
}

const replacing = ref<number | null>(null)
async function onReplace(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  const id = replacing.value
  input.value = ''
  if (!file || id === null) return
  const bytes = new Uint8Array(await file.arrayBuffer())
  const others = props.images.filter(i => i.id !== id)
  const result = checkImage(bytes, totalBytes(others))
  if (!result.ok) { message.value = result.message; return }
  message.value = ''
  emit('update:images', props.images.map(i => i.id === id ? { id, dataUri: toDataUri(bytes, result.mime), bytes: bytes.length, store: !!i.url || i.store } : i))
}
const replaceInput = ref<HTMLInputElement | null>(null)
function startReplace(id: number) {
  replacing.value = id
  replaceInput.value?.click()
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex flex-wrap gap-2" role="toolbar" aria-label="Formatting">
      <UButton label="Bold" size="xs" variant="outline" data-test="fmt-bold" @click="wrap('**')" />
      <UButton label="Italic" size="xs" variant="outline" data-test="fmt-italic" @click="wrap('*')" />
      <UButton label="Heading" size="xs" variant="outline" data-test="fmt-heading" @click="prefix('## ')" />
      <UButton label="List" size="xs" variant="outline" data-test="fmt-list" @click="prefix('- ')" />
      <UButton label="Code" size="xs" variant="outline" data-test="fmt-code" @click="wrap('`')" />
      <UButton label="Link" size="xs" variant="outline" data-test="fmt-link" @click="link" />
      <UButton label="Image" size="xs" variant="outline" data-test="fmt-image" @click="fileInput?.click()" />
      <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple class="hidden" data-test="image-input" @change="onPick">
      <input ref="replaceInput" type="file" accept="image/png,image/jpeg,image/gif,image/webp" class="hidden" data-test="image-replace" @change="onReplace">
      <span class="ml-auto text-sm">Images {{ usedMb }} / 5 MB</span>
    </div>
    <p v-if="message" role="alert" class="text-sm text-error" data-test="editor-message">
      {{ message }}
    </p>
    <div class="grid gap-4 md:grid-cols-2">
      <textarea
        ref="area"
        :value="modelValue"
        rows="20"
        aria-label="Article body"
        class="w-full rounded border border-default p-2 font-mono"
        data-test="editor-body"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        @paste="onFiles"
        @drop="onFiles"
      />
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="article-body overflow-auto rounded border border-default p-2" aria-label="Preview" data-test="editor-preview" v-html="html" />
    </div>
    <ul v-if="images.length" class="space-y-1">
      <li v-for="img in images" :key="img.id" class="flex items-center gap-2" data-test="image-row">
        <img :src="img.dataUri" alt="" class="h-8 w-8 object-cover">
        <label class="flex items-center gap-1 text-sm">Alt text
          <input :value="altOf(img.id)" class="rounded border border-default px-1" :data-test="`alt-${img.id}`" @input="setAlt(img.id, ($event.target as HTMLInputElement).value)">
        </label>
        <UButton :label="coverId === img.id ? 'Cover image ✓' : 'Set as cover'" size="xs" :variant="coverId === img.id ? 'solid' : 'outline'" :data-test="`cover-${img.id}`" @click="emit('update:coverId', coverId === img.id ? null : img.id)" />
        <label class="flex items-center gap-1 text-sm">
          <input type="checkbox" :checked="!!img.store || coverId === img.id" :disabled="coverId === img.id" :data-test="`store-${img.id}`" @change="setStore(img.id, ($event.target as HTMLInputElement).checked)">
          Save to Supabase
        </label>
        <UButton label="Replace" size="xs" variant="outline" @click="startReplace(img.id)" />
        <UButton label="Remove" size="xs" variant="outline" color="error" @click="remove(img.id)" />
      </li>
    </ul>
  </div>
</template>
