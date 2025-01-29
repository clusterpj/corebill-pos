<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-title class="text-h6">
        {{ item?.description ? 'Edit Note' : 'Add Note' }}
      </v-card-title>

      <v-card-text>
        <v-textarea
          v-model="noteText"
          label="Item Note"
          rows="3"
          auto-grow
          variant="outlined"
          density="comfortable"
          hide-details
          class="mt-2"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="grey"
          variant="text"
          @click="closeDialog"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          @click="saveNote"
          :disabled="!noteText.trim()"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  item: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const dialog = ref(props.modelValue)
const noteText = ref('')

// Sync dialog with v-model
watch(() => props.modelValue, (val) => {
  dialog.value = val
})

watch(dialog, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    noteText.value = ''
  }
})

// Initialize note text when item changes
watch(() => props.item, (newItem) => {
  if (newItem) {
    noteText.value = newItem.description || ''
  }
}, { immediate: true })

const closeDialog = () => {
  dialog.value = false
}

const saveNote = () => {
  emit('save', noteText.value.trim())
  closeDialog()
}
</script>
