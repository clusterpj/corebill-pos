export default {
  path: 'kitchen',
  name: 'kitchen',
  component: () => import('./KitchenDisplay.vue'),
  meta: {
    title: 'Kitchen Display',
    requiresAuth: true,
    skipCashierCheck: true
  }
}
