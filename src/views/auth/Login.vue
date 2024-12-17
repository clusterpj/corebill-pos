<!-- src/views/auth/Login.vue -->
<template>
  <div class="login-page">
    <v-container fluid class="fill-height pa-0">
      <v-row align="center" justify="center" no-gutters class="fill-height">
        <v-col cols="12" sm="8" md="6" lg="4" xl="3" class="pa-4">
          <v-card class="login-card" elevation="2" rounded="lg">
            <!-- Header -->
            <div class="login-header">
              <div class="d-flex flex-column align-center pt-8 pb-6">
                <v-avatar
                  color="primary"
                  size="64"
                  class="mb-6"
                >
                  <v-icon
                    icon="mdi-store"
                    size="32"
                    color="white"
                  />
                </v-avatar>
                <h1 class="text-h4 font-weight-bold mb-1 text-primary">
                  {{ appTitle }}
                </h1>
                <p class="text-subtitle-1 text-primary">
                  Sign in to your account
                </p>
              </div>
            </div>

            <v-card-text class="px-6 pt-8 pb-4">
              <v-form @submit.prevent="handleLogin" ref="form">
                <!-- Email Field -->
                <v-text-field
                  v-model="formData.email"
                  :rules="[rules.required, rules.email]"
                  label="Email"
                  prepend-inner-icon="mdi-email"
                  variant="outlined"
                  :error-messages="errors.email"
                  @update:model-value="clearError('email')"
                  required
                  autocomplete="username"
                  class="mb-4 login-field"
                  placeholder="Enter your email"
                  bg-color="surface"
                />

                <!-- Password Field -->
                <v-text-field
                  v-model="formData.password"
                  :rules="[rules.required, rules.minLength]"
                  label="Password"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="showPassword = !showPassword"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  :error-messages="errors.password"
                  @update:model-value="clearError('password')"
                  required
                  autocomplete="current-password"
                  class="mb-4 login-field"
                  placeholder="Enter your password"
                  bg-color="surface"
                />

                <!-- Error Alert -->
                <v-expand-transition>
                  <v-alert
                    v-if="error"
                    type="error"
                    variant="tonal"
                    class="mb-4"
                    closable
                    density="compact"
                    @click:close="error = null"
                  >
                    <template v-slot:prepend>
                      <v-icon icon="mdi-alert-circle" />
                    </template>
                    {{ error }}
                  </v-alert>
                </v-expand-transition>

                <!-- Login Button -->
                <v-btn
                  color="primary"
                  :loading="loading"
                  :disabled="!formIsValid"
                  @click="handleLogin"
                  size="large"
                  block
                  min-height="48"
                  class="mt-2"
                >
                  Continue
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { validateForm } from '@/utils/validation'
import { logger } from '@/utils/logger'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref(null)
const showPassword = ref(false)
const loading = ref(false)
const error = ref(null)
const errors = reactive({
  email: null,
  password: null
})

const appTitle = import.meta.env.VITE_APP_TITLE || 'CorePOS'

const formData = reactive({
  email: '',
  password: ''
})

const rules = {
  required: v => !!v || 'This field is required',
  email: v => /.+@.+\..+/.test(v) || 'Please enter a valid email',
  minLength: v => v.length >= 6 || 'Password must be at least 6 characters'
}

const formIsValid = computed(() => {
  return formData.email && formData.password &&
         !errors.email && !errors.password
})

function clearError(field) {
  errors[field] = null
  error.value = null
}

async function handleLogin() {
  if (!formIsValid.value) return

  // Validate form
  const validationErrors = validateForm(formData, {
    email: ['required', 'email'],
    password: ['required', ['minLength', 6]]
  })

  if (validationErrors) {
    Object.assign(errors, validationErrors)
    return
  }

  loading.value = true
  error.value = null

  try {
    await authStore.login({
      email: formData.email,
      password: formData.password
    })

    logger.info('Login successful', { email: formData.email })
    
    // Navigate to the redirect path or default to POS
    const redirectPath = route.query.redirect || '/pos'
    router.push(redirectPath)
  } catch (err) {
    logger.error('Login failed', err)
    
    if (err.details) {
      Object.assign(errors, err.details)
      error.value = 'Please correct the errors below'
    } else {
      error.value = err.message || 'Login failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: rgb(var(--v-theme-surface));
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 100%;
  max-width: 100%;
  background: white;
}

.login-header {
  background: rgb(var(--v-theme-primary-lighten-5, 237, 245, 255));
}

:deep(.v-field) {
  border-radius: 4px;
}

:deep(.v-list-item) {
  min-height: 48px;
}

:deep(.v-btn) {
  text-transform: none;
  font-weight: 500;
}

:deep(.v-alert) {
  border-left: 4px solid currentColor;
}
</style>