// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import BaseLayout from '../components/BaseLayout.vue'
import posRoutes from '../views/pos/pos.routes'
import kitchenRoutes from '../views/kitchen/kitchen.routes'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/auth/Login.vue'),
    meta: {
      requiresAuth: false,
      layout: 'none'
    }
  },
  {
    path: '/select-cashier',
    name: 'select-cashier',
    component: () => import('../views/auth/SelectCashier.vue'),
    meta: {
      requiresAuth: true,
      layout: 'none'
    }
  },
  {
    path: '/',
    component: BaseLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/pos'
      },
      {
        path: 'items',
        name: 'items',
        component: () => import('../views/Items.vue'),
        meta: {
          title: 'Items Management'
        }
      },
      posRoutes,
      kitchenRoutes
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/errors/NotFound.vue'),
    meta: {
      layout: 'none'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // Always allow login page
  if (to.path === '/login') {
    next()
    return
  }

  // Check if route requires auth
  if (requiresAuth) {
    // If not authenticated, redirect to login
    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }

    // If authenticated but no cashier selected, redirect to cashier selection
    // Only do this if we're not already on the select-cashier page
    if (to.path !== '/select-cashier' && !authStore.hasCashiers) {
      next('/select-cashier')
      return
    }
  }

  next()
})

export default router
