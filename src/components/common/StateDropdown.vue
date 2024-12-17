<template>
  <v-autocomplete
    v-model="selectedState"
    :items="states"
    :loading="loading"
    :error-messages="error"
    :label="label"
    :required="required"
    :disabled="disabled"
    item-title="name"
    item-value="code"
    variant="outlined"
    density="comfortable"
    :hint="loading ? 'Loading states...' : undefined"
    persistent-hint
    @update:model-value="onStateSelect"
  >
    <template v-slot:no-data>
      <v-list-item v-if="loading">
        <v-list-item-title>
          Loading states...
        </v-list-item-title>
      </v-list-item>
      <v-list-item v-else>
        <v-list-item-title>
          No states found
        </v-list-item-title>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { statesApi } from '@/services/api/states'
import { logger } from '@/utils/logger'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: 'State'
  },
  required: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: undefined
  },
  countryCode: {
    type: String,
    default: 'US'
  }
})

const emit = defineEmits(['update:modelValue', 'state-selected'])

const loading = ref(false)
/** @type {import('vue').Ref<Array<{id: number, code: string, name: string, country_code: string}>>} */
const states = ref([])
const selectedState = ref(props.modelValue)

const fetchStates = async () => {
  loading.value = true
  try {
    const response = await statesApi.getStates(props.countryCode)
    states.value = response.states
    logger.info(`Loaded ${states.value.length} states`)
  } catch (error) {
    logger.error('Failed to fetch states:', error)
    throw error
  } finally {
    loading.value = false
  }
}

/**
 * @param {string} stateCode
 */
const onStateSelect = (stateCode) => {
  const selectedState = states.value.find(state => state.code === stateCode)
  if (selectedState) {
    emit('update:modelValue', stateCode)
    emit('state-selected', selectedState)
    logger.debug('State selected:', selectedState)
  }
}

watch(() => props.modelValue, (newValue) => {
  selectedState.value = newValue
})

onMounted(() => {
  fetchStates()
})
</script>
