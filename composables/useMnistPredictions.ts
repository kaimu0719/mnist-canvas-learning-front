import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'
import type { PredictionShowResponse, PendingItem } from '@/types'

export function useMnistPredictions() {
  const items = ref<PendingItem[]>([])
  const isSending = ref(false)
  const config = useRuntimeConfig()
  const API = config.public.apiBase

  const submit = async (label: number, file: File) => {
    isSending.value = true
    try {
      const form = new FormData()
      form.append('image', file)
      form.append('label', String(label))

      const response = await $fetch<PredictionShowResponse>(`${API}/v1/predictions`, {
        method: 'POST',
        body: form,
        headers: { Accept: 'application/json' }
      })

      const predictionId = response.data.prediction_log.id
      const drawingId = response.data.prediction_log.drawing_id

      items.value.unshift({
        key: `${drawingId}-${predictionId}-${Date.now()}`,
        drawingId,
        predictionId
      })
    } catch {

    } finally {
      isSending.value = false
    }
  }

  return { items, isSending, submit }
}