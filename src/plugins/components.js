// src/plugins/components.js
import BaseLayout from '@/components/BaseLayout.vue'
import AppButton from '@/components/AppButton.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import LoadingState from '@/components/LoadingState.vue'

export default {
  install(app) {
    app.component('BaseLayout', BaseLayout)
    app.component('AppButton', AppButton)
    app.component('ErrorBoundary', ErrorBoundary)
    app.component('LoadingState', LoadingState)
  }
}