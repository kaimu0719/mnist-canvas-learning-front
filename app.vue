<script setup lang="ts">
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const ctxRef = ref<CanvasRenderingContext2D | null>(null)

  const drawing = ref(false)
  const label = ref<number | null>(null)
  const strokeWidth = ref(18)

  const runtimeConfig = useRuntimeConfig()
  const API = runtimeConfig.public.apiBase

  const isSending = ref(false)

  async function submitSample() {
    if (!canvasRef.value || !ctxRef.value) return
    if (label.value === null) {
      alert('正解ラベル（0〜9）を選択してください')
      return
    }

    const dataUrl = canvasRef.value.toDataURL('image/png')

    try {
      isSending.value = true

      console.log("画像", dataUrl)
      console.log("ラベル", label.value)
      console.log(`${API}/api/samples`)

      alert('送信しました！')
      clearCanvas()
      label.value = null
    } catch (err) {
      console.error(err)
      alert('送信に失敗しました')
    } finally {
      isSending.value = false
    }
  }

  onMounted(() => {
    if (!canvasRef.value) return
    const canvas = canvasRef.value
    const devicePixelRatio = window.devicePixelRatio
    const width = 280
    const height = 280

    // 物理ピクセル対応
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    const ctx = canvas.getContext('2d')
    if (!ctx) return
  
    ctx.scale(devicePixelRatio, devicePixelRatio)

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, width, height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = strokeWidth.value
    ctxRef.value = ctx

    const getCanvasPosition = (e: MouseEvent) => {
      const rectangle = canvas.getBoundingClientRect()

      return { x: e.clientX - rectangle.left, y: e.clientY - rectangle.top }
    }

    const startDrawing = (e: MouseEvent) => {
      drawing.value = true
      const { x, y } = getCanvasPosition(e)
      ctx.beginPath()
      ctx.moveTo(x, y)
    }

    const drawLine = (e: MouseEvent) => {
      if (!drawing.value) return
      const { x, y } = getCanvasPosition(e)
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    const stopDrawing = () => (drawing.value = false)

    canvas.addEventListener('mousedown', startDrawing)
    canvas.addEventListener('mousemove', drawLine)
    window.addEventListener('mouseup', stopDrawing)
  })

  function clearCanvas() {
    if (!canvasRef.value) return
    const canvas = canvasRef.value
  
    if (!ctxRef.value) return
    const ctx = ctxRef.value

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#fff'
  }
</script>

<template>
  <main class="mx-auto max-w-md p-6 space-y-4">
    <h1 class="text-xl font-semibold">手書き数字を描いて送信</h1>

    <div class="rounded-2xl border bg-white shadow-sm p-4 space-y-3">
      <!-- キャンバス -->
      <div class="flex justify-center">
        <canvas ref="canvasRef" class="border border-neutral-300 rounded-lg touch-none select-none"></canvas>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="flex items-center gap-2">
          <span class="text-sm text-neutral-600">正解ラベル</span>
          <select
            v-model.number="label"
            class="w-full rounded-md border px-2 py-1 text-sm"
          >
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
            v-model.number="strokeWidth"
            @input="ctxRef && (ctxRef.lineWidth = strokeWidth)"
            class="w-full accent-black"
          />
          <span class="text-sm tabular-nums w-8 text-right">{{ strokeWidth }}</span>
        </label>
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          @click="clearCanvas"
          class="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-neutral-50 active:scale-[0.99] transition"
        >
          クリア
        </button>

        <button type="button" @click="submitSample" :disabled="isSending || label === null"
          class="inline-flex items-center gap-2 rounded-md bg-black text-white px-3 py-2 text-sm disabled:opacity-50 hover:opacity-90 active:scale-[0.99] transition">
          {{ isSending ? '送信中...' : 'サンプル送信' }}
        </button>
      </div>
    </div>
  </main>
</template>
