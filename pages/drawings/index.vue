<script setup lang="ts">
  type Drawing = {
    id: number
    label: number
    image_url: string | null
  }

  type DrawingsResponse = {
    status: string
    data: Drawing[]
  }

  const { data, error, pending } = await useFetch<DrawingsResponse>(
    'http://localhost:3000/v1/drawings'
  )

  const drawings = computed(() => data.value?.data ?? [])
</script>

<template>
  <main class="mx-auto max-w-md p-6 space-y-4">
    <h1 class="text-xl font-semibold">MNISTデータ一覧</h1>

    <div v-if="error">読み込みに失敗しました</div>
    <div v-else-if="pending">読み込み中...</div>
    <ul v-else class="space-y-4">
      <li v-for="d in drawings" :key="d.id" class="flex items-center gap-4">
        <img
          v-if="d.image_url"
          :src="d.image_url"
          :alt="`drawing-${d.id}`"
          class="w-16 h-16 object-contain border rounded bg-white"
        />
        <span class="text-lg font-mono">{{ d.label }}</span>
      </li>
    </ul>
  </main>
</template>
