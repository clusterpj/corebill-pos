// src/views/pos/pos.routes.js
export default {
  path: 'pos',
  name: 'pos',
  component: () => import('./PosView.vue'),
  meta: {
    title: 'Point of Sale',
    requiresAuth: true
  }
}
