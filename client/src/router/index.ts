import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/boty',
    },
    {
      path: '/wyniki',
      name: 'wyniki',
      component: () => import('../views/ResultsView.vue'),
    },
    {
      path: '/ranking',
      name: 'ranking',
      component: () => import('../views/RankingView.vue'),
    },
    {
      path: '/boty',
      name: 'boty',
      component: () => import('../views/BotsView.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/boty/:id',
      name: 'bot/:id',
      component: () => import('../views/BotDetailsView.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/konto',
      name: 'konto',
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
