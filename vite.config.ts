import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import trips from './scripts/vite-plugin-trips.ts'

export default defineConfig({
  base: process.env.BASE_PATH ?? '/travel-guide/',
  plugins: [react(), trips()],
})
