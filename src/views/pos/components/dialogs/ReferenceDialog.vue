<template>
  <v-dialog v-model="show" max-width="400">
    <v-card>
      <v-card-title>Enter Reference Number</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="referenceNumber"
          label="Reference Number"
          :rules="[v => !!v || 'Reference number is required']"
          required
          density="compact"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="grey"
          variant="text"
          @click="close"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!referenceNumber"
          @click="confirm"
        >
          Hold Order
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const referenceNumber = ref('')

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const close = () => {
  show.value = false
  referenceNumber.value = ''
}

const confirm = () => {
  if (!referenceNumber.value) return
  emit('confirm', referenceNumber.value)
  close()
}
</script>
