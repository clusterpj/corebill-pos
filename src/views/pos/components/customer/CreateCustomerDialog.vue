<template>
  <v-dialog v-model="dialog" max-width="600" :scrim="true" transition="dialog-bottom-transition" class="rounded-lg">
    <v-card class="rounded-lg">
      <v-toolbar color="primary" density="comfortable">
        <v-toolbar-title class="text-h6 font-weight-medium">
          Create New Customer
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-toolbar>

      <v-card-text>
        <v-container>
          <!-- Customer Information Section -->
          <v-row>
            <v-col cols="12">
              <div class="text-subtitle-1 mb-2">Customer Information</div>
              <v-text-field
                v-model="formData.name"
                label="Full Name"
                :error-messages="errors.name"
                @input="clearError('name')"
                required
                variant="outlined"
                density="comfortable"
                class="mb-3"
              ></v-text-field>

              <v-text-field
                v-model="formData.phone"
                label="Phone Number"
                :error-messages="errors.phone"
                @input="clearError('phone')"
                required
                variant="outlined"
                density="comfortable"
                class="mb-3"
              ></v-text-field>

              <v-text-field
                v-model="formData.email"
                label="Email (Optional)"
                variant="outlined"
                density="comfortable"
                class="mb-3"
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- Address Section -->
          <v-row>
            <v-col cols="12">
              <div class="text-subtitle-1 mb-2">Address Information</div>
              <v-text-field
                v-model="formData.address"
                label="Street Address"
                :error-messages="errors.address"
                @input="clearError('address')"
                required
                variant="outlined"
                density="comfortable"
                class="mb-3"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.unit"
                label="Apt/Suite/Unit (Optional)"
                variant="outlined"
                density="comfortable"
                class="mb-3"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.zipCode"
                label="ZIP Code"
                :error-messages="errors.zipCode"
                @input="clearError('zipCode')"
                required
                variant="outlined"
                density="comfortable"
                class="mb-3"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.city"
                label="City"
                :error-messages="errors.city"
                @input="clearError('city')"
                required
                variant="outlined"
                density="comfortable"
                class="mb-3"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <StateDropdown
                v-model="formData.state"
                :error="errors.state"
                @state-selected="onStateSelect"
                @update:model-value="clearError('state')"
                class="mb-3"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-btn
                color="primary"
                size="large"
                block
                height="56"
                @click="createCustomer"
                :loading="creating"
                :disabled="creating"
                elevation="2"
              >
                <v-icon start>mdi-account-plus</v-icon>
                Create Customer
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import StateDropdown from '@/components/common/StateDropdown.vue'
import { useCustomerSearch } from '../../composables/useCustomerSearch'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'customer-created'])

const { createCustomer: apiCreateCustomer } = useCustomerSearch()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formData = reactive({
  name: '',
  phone: '',
  email: '',
  address: '',
  unit: '',
  city: '',
  state: '',
  state_id: null,
  zipCode: '',
})

const onStateSelect = (state) => {
  formData.state_id = state.id
}

const initialFormData = { ...formData }

const resetForm = () => {
  Object.assign(formData, initialFormData)
  clearAllErrors()
}

const errors = reactive({
  name: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
})

const creating = ref(false)

const validateForm = () => {
  let isValid = true
  clearAllErrors()

  if (!formData.name.trim()) {
    errors.name = 'Name is required'
    isValid = false
  } else if (formData.name.trim().length < 3) {
    errors.name = 'Name must be at least 3 characters'
    isValid = false
  } else if (formData.name.trim().length > 100) {
    errors.name = 'Name must not exceed 100 characters'
    isValid = false
  }

  if (formData.phone.trim() && (formData.phone.trim().length < 3 || formData.phone.trim().length > 25)) {
    errors.phone = 'Phone number must be between 3 and 25 characters'
    isValid = false
  }

  if (formData.address.trim() && (formData.address.trim().length < 3 || formData.address.trim().length > 120)) {
    errors.address = 'Address must be between 3 and 120 characters'
    isValid = false
  }

  if (!formData.city.trim()) {
    errors.city = 'City is required'
    isValid = false
  } else if (formData.city.trim().length > 50) {
    errors.city = 'City must not exceed 50 characters'
    isValid = false
  }

  if (!formData.state.trim()) {
    errors.state = 'State is required'
    isValid = false
  } else if (formData.state.trim().length > 2) {
    errors.state = 'Please use 2-letter state code'
    isValid = false
  }

  if (!formData.zipCode.trim()) {
    errors.zipCode = 'ZIP code is required'
    isValid = false
  } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode.trim())) {
    errors.zipCode = 'Invalid ZIP code format'
    isValid = false
  }

  if (formData.email.trim()) {
    if (formData.email.trim().length < 5 || formData.email.trim().length > 120) {
      errors.email = 'Email must be between 5 and 120 characters'
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address'
      isValid = false
    }
  }

  return isValid
}

const clearError = (field) => {
  errors[field] = ''
}

const clearAllErrors = () => {
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

const createCustomer = async () => {
  if (!validateForm()) return

  creating.value = true

  try {
    const customerData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      // Only include email if it's not empty
      ...(formData.email.trim() && { email: formData.email.trim() }),
      address_street_1: formData.address.trim(),
      address_street_2: formData.unit.trim() || null,
      city: formData.city.trim(),
      state: formData.state.trim(),
      zip: formData.zipCode.trim(),
      state_id: formData.state_id,
      status_customer: 'A',
      company_id: 1,
      avalara_type: 0,
      prepaid_option: 0,
      notes: '',
      // Add required fields for user creation
      first_name: formData.name.trim(),
      last_name: formData.name.trim(),
      contact_name: formData.name.trim(),
      customer_type: 'R',
      role: 'customer',
      sale_type: 'Retail',
      language: 'en',
      timezone: 'America/Chicago',
      status_payment: 'prepaid',
      type_vat_regime: 1,
      incorporated: 1,
      lfln: 1
    }

    try {
      const response = await apiCreateCustomer(customerData)
      
      if (!response?.id) {
        throw new Error('Invalid response from server')
      }

      const customer = {
        id: response.id,
        ...customerData
      }

      // Show success message
      if (window.toastr) {
        window.toastr.success('Customer created successfully')
      }
      
      // Emit customer data and close dialog
      emit('customer-created', customer)
      resetForm()
      closeDialog()
    } catch (error) {
      // Handle specific API error responses
      if (error.response?.data) {
        const apiError = error.response.data
        
        // Check for duplicate customer errors
        if (apiError.code === 'DUPLICATE_ENTRY') {
          if (apiError.field === 'phone') {
            errors.phone = 'This phone number is already registered'
          } else if (apiError.field === 'email') {
            errors.email = 'This email is already registered'
          } else {
            throw new Error(apiError.message || 'Customer already exists')
          }
          return
        }
        
        // Handle validation errors from API
        if (apiError.details) {
          Object.keys(apiError.details).forEach(field => {
            if (errors.hasOwnProperty(field)) {
              errors[field] = apiError.details[field]
            }
          })
          return
        }
      }
      
      // If we get here, it's an unexpected error
      throw error
    }
  } catch (error) {
    console.error('Customer creation error:', error)
    const errorMessage = error.response?.data?.message || 
      error.message || 
      'Failed to create customer'
    
    if (window.toastr) {
      window.toastr.error(errorMessage)
    } else {
      console.error(errorMessage)
    }
  } finally {
    creating.value = false
  }
}

const closeDialog = () => {
  if (creating.value) {
    return
  }
  
  resetForm()
  dialog.value = false
}

// Prevent closing dialog while submitting
watch(() => props.modelValue, (newVal) => {
  if (!newVal && creating.value) {
    dialog.value = true
  }
})
</script>

<style scoped>
.v-card-text {
  padding-top: 20px;
}

.text-subtitle-1 {
  color: rgba(var(--v-theme-on-surface), 0.7);
}
</style>
