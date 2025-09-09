import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

type InitOptions = {
  width?: number
  height?: number
  strokeWidth?: number
  bgColor?: string
  strokeColor?: string
}

export function useDrawingCanvas(options: InitOptions = {}) {
  const {
    width = 280,
    height = 280,
    strokeWidth = 18,
    bgColor = '#000',
    strokeColor = '#fff'
  } = options

  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const contextRef = ref<CanvasRenderingContext2D | null>(null)
  const drawing = ref(false)
  const penWidth = ref<number>(strokeWidth)

  const paintBackground = () => {
    const canvas = canvasRef.value!
    const context = contextRef.value!
    context.fillStyle = bgColor
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = strokeColor
  }

  const resizeForDevicePixelRatio = () => {
    if (canvasRef.value == null) return
    const canvas = canvasRef.value
    devicePixelRatio = window.devicePixelRatio || 1
    canvas.width = Math.round(width * devicePixelRatio)
    canvas.height = Math.round(height * devicePixelRatio)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const context = canvas.getContext('2d')
    if (context == null) return
    context.setTransform(1, 0, 0, 1, 0, 0) 
    context.scale(devicePixelRatio, devicePixelRatio)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = penWidth.value
    contextRef.value = context
    paintBackground()
  }

  const getLocalPosition = (e: PointerEvent) => {
    const canvas = canvasRef.value!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e: PointerEvent) => {
    if (!contextRef.value || !canvasRef.value) return
    drawing.value = true
    canvasRef.value.setPointerCapture(e.pointerId)
    const { x, y } = getLocalPosition(e)
    contextRef.value.beginPath()
    contextRef.value.moveTo(x, y)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!drawing.value || !contextRef.value) return
    const { x, y } = getLocalPosition(e)
    contextRef.value.lineTo(x, y)
    contextRef.value.stroke()
  }

  const onPointerUp = (e: PointerEvent) => {
    drawing.value = false
    try { canvasRef.value?.releasePointerCapture(e.pointerId) } catch {}
  }

  const clear = () => {
    if (!canvasRef.value || !contextRef.value) return
    paintBackground()
  }

  /** 28x28へ縮小（OffscreenCanvasがあれば使用） */
  const to28x28Canvas = async (): Promise<HTMLCanvasElement | OffscreenCanvas> => {
    const src = canvasRef.value!
    const width = 28, height = 28

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const octx = canvas.getContext('2d')!
    octx.imageSmoothingEnabled = true
    octx.drawImage(src, 0, 0, width, height)
    return canvas
  }

  const toBlob = async (el: HTMLCanvasElement | OffscreenCanvas, type = 'image/png', quality?: number) => {
    if (el instanceof OffscreenCanvas) {
      const blob = await el.convertToBlob({ type, quality })
      return blob
    } else {
      return await new Promise<Blob>((resolve, reject) => {
        el.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), type, quality)
      })
    }
  }

  onMounted(() => {
    resizeForDevicePixelRatio()
    canvasRef.value?.addEventListener('pointerdown', onPointerDown)
    canvasRef.value?.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('resize', resizeForDevicePixelRatio)
  })

  onBeforeUnmount(() => {
    canvasRef.value?.removeEventListener('pointerdown', onPointerDown)
    canvasRef.value?.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('resize', resizeForDevicePixelRatio)
  })

  watch(penWidth, (width) => {
    if (contextRef.value) contextRef.value.lineWidth = width
  })

  return {
    canvasRef,
    contextRef,
    drawing,
    penWidth,
    width,
    height,
    clear,
    to28x28Canvas,
    toBlob,
  }
}