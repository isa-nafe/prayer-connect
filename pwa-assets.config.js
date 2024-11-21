import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023'
  },
  preset: {
    maskable: true,
    apple: true
  },
  images: ['client/public/logo.svg']
})
