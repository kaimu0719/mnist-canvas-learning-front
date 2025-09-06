<script setup lang="ts">
  type DrawingJson = {
    status: "ok"
    data: {
      id: number
      label: number
      image: null | {
        content_type: string
        byte_size: number
        url: string
      }
    }
  }

  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const contextRef = ref<CanvasRenderingContext2D | null>(null)

  const drawing = ref(false)
  const label = ref<number | null>(null)
  const strokeWidth = ref(18)

  const runtimeConfig = useRuntimeConfig()
  const API = runtimeConfig.public.apiBase

  const isSending = ref(false)

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

    const context = canvas.getContext('2d')
    if (!context) return
  
    context.scale(devicePixelRatio, devicePixelRatio)

    context.fillStyle = '#000'
    context.fillRect(0, 0, width, height)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = '#fff'
    context.lineWidth = strokeWidth.value
    contextRef.value = context

    const getCanvasPosition = (e: MouseEvent) => {
      const rectangle = canvas.getBoundingClientRect()

      return { x: e.clientX - rectangle.left, y: e.clientY - rectangle.top }
    }

    const startDrawing = (e: MouseEvent) => {
      drawing.value = true
      const { x, y } = getCanvasPosition(e)
      context.beginPath()
      context.moveTo(x, y)
    }

    const drawLine = (e: MouseEvent) => {
      if (!drawing.value) return
      const { x, y } = getCanvasPosition(e)
      context.lineTo(x, y)
      context.stroke()
    }

    const stopDrawing = () => (drawing.value = false)

    canvas.addEventListener('mousedown', startDrawing)
    canvas.addEventListener('mousemove', drawLine)
    window.addEventListener('mouseup', stopDrawing)
  })

  function clearCanvas() {
    if (!canvasRef.value) return
    const canvas = canvasRef.value
  
    if (!contextRef.value) return
    const context = contextRef.value

    context.fillStyle = '#000'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = '#fff'
  }

  function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number) {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob from canvas'))
        }
      }, type, quality)
    })
  }

  async function downscaleTo28x28(srcCanvas: HTMLCanvasElement) {
    const offScreenCanvas = document.createElement('canvas')
    offScreenCanvas.width = 28
    offScreenCanvas.height = 28
    const offCtx = offScreenCanvas.getContext('2d')!

    offCtx.imageSmoothingEnabled = true
    offCtx.drawImage(srcCanvas, 0, 0, offScreenCanvas.width, offScreenCanvas.height)
    return offScreenCanvas
  }

  async function submitSample() {
    if (!canvasRef.value || !contextRef.value) return
    if (label.value === null) {
      alert('正解ラベル（0~9）を選択してください')
      return
    }

    try {
      isSending.value = true

      // 28x28へ変換
      const src = await downscaleTo28x28(canvasRef.value)

      const blob = await canvasToBlob(src, 'image/png')
      console.log(blob)
      const file = new File([blob] , 'sample.png', { type: 'image/png' })

      const form = new FormData()
      form.append('image', file)  
      form.append('label', String(label.value))

      const response = await $fetch<DrawingJson>(`${API}/v1/drawings`, {
        method: "POST",
        body: form,
        headers: { Accept: 'application/json' }
      })

      console.log(response)

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
            @input="contextRef && (contextRef.lineWidth = strokeWidth)"
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
