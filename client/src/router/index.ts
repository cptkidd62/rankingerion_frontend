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
        requiresAuth: true,
        title: 'Rankingerion'
      }
    },
    {
      path: '/ranking',
      name: 'ranking',
      component: () => import('../views/RankingView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Ranking - Rankingerion'
      }
    },
    {
      path: '/bots',
      name: 'bots',
      component: () => import('../views/BotsView.vue'),
      meta: {
        requiresAuth: true,
        title: 'My bots - Rankingerion'
      }
    },
    {
      path: '/bots/:id',
      name: 'bots/:id',
      component: () => import('../views/BotDetailsView.vue'),
      meta: {
        requiresAuth: true,
        title: 'Bot details - Rankingerion'
      }
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('../views/AccountView.vue'),
      meta: {
        requiresAuth: true,
        title: 'My account - Rankingerion'
      }
    },
    {
      path: '/signin',
      name: 'signin',
      component: () => import('../views/LoginView.vue'),
      meta: {
        title: 'Sign in - Rankingerion'
      }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/bots',
    },
  ],
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title as string;
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) {
    next('/signin')
  } else {
    next()
  }
})

export default router
