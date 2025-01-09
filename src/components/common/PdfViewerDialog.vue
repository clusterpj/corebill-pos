# src/components/common/PdfViewerDialog.vue
<template>
  <v-dialog v-model="dialog" max-width="1000px" persistent>
    <v-card>
      <v-toolbar color="primary" dark>
        <v-toolbar-title>{{ title }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="print">
          <v-icon>mdi-printer</v-icon>
        </v-btn>
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pdf-container">
        <div v-if="loading" class="d-flex justify-center align-center pa-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        <iframe
          v-show="!loading"
          :src="pdfUrl"
          width="100%"
          height="600"
          @load="handleIframeLoad"
        ></iframe>
      </v-card-text>

      <v-card-actions class="d-flex justify-space-between pa-4">
        <v-btn
          color="primary"
          variant="outlined"
          @click="print"
          :disabled="loading"
        >
          <v-icon left>mdi-printer</v-icon>
          Print
        </v-btn>
        <v-btn
          color="grey"
          variant="outlined"
          @click="closeDialog"
        >
          Close
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
    default: false
  },
  pdfUrl: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Invoice'
  }
})

const emit = defineEmits(['update:modelValue', 'closed'])

const dialog = ref(props.modelValue)
const loading = ref(true)

watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal
})

watch(dialog, (newVal) => {
  emit('update:modelValue', newVal)
  if (!newVal) {
    emit('closed')
  }
})

const handleIframeLoad = () => {
  // Add a small delay to ensure the PDF is actually loaded
  setTimeout(() => {
    loading.value = false
  }, 500)
}

// Reset loading state when PDF URL changes
watch(() => props.pdfUrl, () => {
  loading.value = true
})

const print = () => {
  const iframe = document.querySelector('iframe')
  if (iframe) {
    iframe.contentWindow.print()
  }
}

const closeDialog = () => {
  dialog.value = false
}
</script>

<style scoped>
.pdf-container {
  min-height: 600px;
  padding: 0;
}

iframe {
  border: none;
}
</style>
