<script setup lang="ts">
useHead({
  title: 'TetherDNS',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'TetherDNS' },
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
  ],
})
</script>

<template>
  <UApp>
    <div class="dark">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </UApp>
</template>

<style>
/* Base dark mode enforcement if not handled by Nuxt UI global state */
body {
  background-color: #030712;
  /* gray-950 */
  color: #f3f4f6;
  /* gray-100 */
}
</style>
