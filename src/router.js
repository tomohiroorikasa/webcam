import { createWebHashHistory, createRouter } from 'vue-router'

import Main from '@/components/Main.vue'

const routes = [
  { path: '/', name: 'Main', component: Main }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
