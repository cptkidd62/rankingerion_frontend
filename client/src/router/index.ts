import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/bots',
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/ranking',
      name: 'ranking',
      component: () => import('../views/RankingView.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/bots',
      name: 'bots',
      component: () => import('../views/BotsView.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/bots/:id',
      name: 'bots/:id',
      component: () => import('../views/BotDetailsView.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('../views/AccountView.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/signin',
      name: 'signin',
      component: () => import('../views/LoginView.vue'),
    },
  ],
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) {
    next('/signin')
  } else {
    next()
  }
})

export default router
