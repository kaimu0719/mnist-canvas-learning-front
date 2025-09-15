<script setup lang="ts">
  import { PredictionCard } from '#components'
  import { useDrawingCanvas } from '@/composables/useDrawingCanvas'
  import { useMnistPredictions } from '@/composables/useMnistPredictions'

  const { canvasRef, penWidth, clear, to28x28Canvas, toBlob } = useDrawingCanvas({
    width: 280,
    height: 280,
    strokeWidth: 18
  })
  const { items, isSending, submit } = useMnistPredictions()

  const label = ref<number | null>(null)

  async function submitDrawing() {  
    try {
      const canvas = await to28x28Canvas()
      const blob = await toBlob(canvas, 'image/png')
      const file = new File([blob], 'sample.png', { type: 'image/png' })
      await submit(label.value, file)
      clear()
      label.value = null
    } catch (e) {
      console.log(e)
      alert('送信に失敗しました')
    }
  }
</script>

<template>
  <main class="mx-auto max-w-md p-6 space-y-4">
    <h1 class="text-xl font-semibold">手書き数字を描いて送信</h1>

    <div class="rounded-2xl border bg-white shadow-sm p-4 space-y-3">
      <div class="flex justify-center">
        <canvas ref="canvasRef" class="border border-neutral-300 rounded-lg touch-none select-none"></canvas>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="flex items-center gap-2">
          <span class="text-sm text-neutral-600">正解ラベル</span>
          <select v-model.number="label" class="w-full rounded-md border px-2 py-1 text-sm">
            <option :value="null">選択してください</option>
            <option v-for="n in 10" :key="n" :value="n-1">{{ n-1 }}</option>
          </select>
        </label>
      
        <label class="flex items-center gap-2">
          <span class="text-sm text-neutral-600 whitespace-nowrap">ペン太さ</span>
          <input
            type="range"
            min="6"
            max="40"
            v-model.number="penWidth"
            class="w-full accent-black"
          />
          <span class="text-sm tabular-nums w-8 text-right">{{ penWidth }}</span>
        </label>
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          @click="clear"
          class="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-neutral-50 active:scale-[0.99] transition"
        >
          クリア
        </button>

        <button type="button" @click="submitDrawing" :disabled="isSending"
          class="inline-flex items-center gap-2 rounded-md bg-black text-white px-3 py-2 text-sm disabled:opacity-50 hover:opacity-90 active:scale-[0.99] transition">
          {{ isSending ? '送信中...' : 'サンプル送信' }}
        </button>
      </div>
    </div>

    <section class="space-y-3">
      <PredictionCard
        v-for="it in items"
        :key="it.key"
        :drawing-id="it.drawingId"
        :prediction-id="it.predictionId"
      />
    </section>
  </main>
</template>
