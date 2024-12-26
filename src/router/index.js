// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCompanyStore } from '../stores/company'
import BaseLayout from '../components/BaseLayout.vue'
import posRoutes from '../views/pos/pos.routes'
import kitchenRoutes from '../views/kitchen/kitchen.routes'
import KitchenDisplay from '@/views/kitchen/KitchenDisplay.vue'
import BarDisplay from '@/views/bar/BarDisplay.vue'

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
      {
        path: '/customer-display',
        name: 'customer-display',
        component: () => import('@/views/pos/CustomerDisplayView.vue')
      },
      posRoutes,
      kitchenRoutes,
      {
        path: '/kitchen-display',
        name: 'KitchenDisplay',
        component: KitchenDisplay,
        meta: {
          requiresAuth: true,
          title: 'Kitchen Display'
        }
      },
      {
        path: '/bar-display',
        name: 'BarDisplay',
        component: BarDisplay,
        meta: {
          requiresAuth: true,
          title: 'Bar Display'
        }
      }
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
  const companyStore = useCompanyStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const skipCashierCheck = to.matched.some(record => record.meta.skipCashierCheck)

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

    // If we're already on select-cashier, allow it
    if (to.path === '/select-cashier') {
      next()
      return
    }

    // Try to initialize company store if not already initialized
    if (!companyStore.initializationComplete) {
      try {
        await companyStore.initializeStore()
      } catch (error) {
        logger.error('Failed to initialize company store:', error)
      }
    }

    // After initialization attempt, check if we need to select a cashier
    if (!skipCashierCheck && !companyStore.isConfigured) {
      next('/select-cashier')
      return
    }
  }

  next()
})

export default router
