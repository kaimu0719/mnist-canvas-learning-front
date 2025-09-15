<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  drawingId: number
  predictionId: number
}>()

type DrawingShowResponse = {
  status: 'ok'
  data: {
    drawing: {
      id: number
      label: number
    },
    image: {
      content_type: string
      byte_size: number
      url: string
    } | null
  }
}

type PredictionShowResponse = {
  status: 'ok'
  data: {
    prediction_log: {
      id: number
      drawing_id: number
      job_id: string
      status: string
      answer: number | null
    }
  }
}

const runtimeConfig = useRuntimeConfig()
const API = runtimeConfig.public.apiBase

const loading = ref(true)
const errMsg = ref<string | null>(null)

const imageUrl = ref<string | null>(null)
const label = ref<number | null>(null)

const predStatus = ref<PredictionShowResponse['data']['prediction_log']['status'] | null>(null)
const answer = ref<number | null>(null)

let timer: number | null = null
let aborted = false

function toAbsoluteUrl(pathOrUrl: string | null): string | null {
  if (!pathOrUrl) return null
  try {
    const u = new URL(pathOrUrl)
    return u.toString()
  } catch {
    return new URL(pathOrUrl, API).toString()
  }
}

async function fetchDrawing() {
  const res = await $fetch<DrawingShowResponse>(`${API}/v1/drawings/${props.drawingId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  label.value = res.data.drawing.label
  imageUrl.value = toAbsoluteUrl(res.data.image?.url ?? null)
}

async function fetchPredictionOnce() {
  const res = await $fetch<PredictionShowResponse>(`${API}/v1/predictions/${props.predictionId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  predStatus.value = res.data.prediction_log.status
  answer.value = res.data.prediction_log.answer
  return res.data.prediction_log.status
}

function startPolling() {
  fetchPredictionOnce()
    .then((status) => {
      if (aborted) return
      if (status === 'completed' || status === 'failed') return
      timer = window.setInterval(async () => {
        try {
          const s = await fetchPredictionOnce()
          if (aborted) return
          if (s === 'completed' || s === 'failed') {
            stopPolling()
          }
        } catch (e) {
          console.error(e)
        }
      }, 3000)
    })
    .catch((e) => {
      console.error(e)
      errMsg.value = '予測結果の取得に失敗しました'
    })
}

function stopPolling() {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(async () => {
  try {
    await fetchDrawing()
    startPolling()
  } catch (e) {
    console.error(e)
    errMsg.value = 'データの取得に失敗しました'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  aborted = true
  stopPolling()
})
</script>

<template>
  <article class="rounded-xl border bg-white shadow-sm p-4">
    <header class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-neutral-800">
        MNISTデータ #{{ props.drawingId }}
      </h2>
      <p v-if="predStatus" class="text-xs text-neutral-500">
        ステータス: <span class="tabular-nums">{{ predStatus }}</span>
      </p>
    </header>

    <div v-if="loading" class="text-sm text-neutral-500">読み込み中...</div>
    <div v-else-if="errMsg" class="text-sm text-red-600">{{ errMsg }}</div>
    <div v-else class="flex items-start gap-4">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        alt="MNIST sample"
        class="w-[112px] h-[112px] border rounded-md object-contain bg-black/90"
      />
      <div class="flex-1 space-y-1">
        <div class="text-sm">
          ラベル:
          <span class="font-mono text-base">{{ label ? label : "未定義" }}</span>
          <template v-if="predStatus === 'completed' && answer !== null">
            <span class="mx-2 text-neutral-400">/</span>
            AI推測ラベル:
            <span class="font-mono text-base">{{ answer }}</span>
          </template>
        </div>
        <div class="text-xs text-neutral-500">
          Prediction #{{ props.predictionId }}
        </div>
        <div v-if="predStatus && predStatus !== 'completed' && predStatus !== 'failed'" class="text-xs text-neutral-500">
          予測中…
        </div>
        <div v-if="predStatus === 'failed'" class="text-xs text-red-600">
          予測に失敗しました
        </div>
      </div>
    </div>
  </article>
</template>
