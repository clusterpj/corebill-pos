# src/components/common/PdfViewerDialog.vue
<template>
  <v-dialog v-model="dialog" max-width="1000px" persistent>
    <v-card>
      <v-toolbar color="primary" dark>
        <v-toolbar-title>{{ title }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-dialog v-model="printerDialog" max-width="500px">
        <v-card>
          <v-card-title>Select Printer</v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedPrinter"
              :items="availablePrinters"
              item-title="name"
              return-object
              label="Select a printer"
            ></v-select>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="confirmPrinter">Select</v-btn>
            <v-btn color="error" @click="printerDialog = false">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

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

      <v-card-actions class="d-flex justify-end pa-4">
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

const emit = defineEmits(['update:modelValue', 'closed', 'error'])

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
  try {
    // Validate PDF URL first
    if (!props.pdfUrl || !props.pdfUrl.includes('/pdf/')) {
      throw new Error('Invalid PDF URL format')
    }

    const iframe = document.querySelector('iframe')
    if (!iframe) {
      throw new Error('PDF iframe not found')
    }

    // Check if PDF is actually loaded
    const pdfWindow = iframe.contentWindow
    if (!pdfWindow || pdfWindow.document.readyState !== 'complete') {
      throw new Error('PDF window not ready')
    }

    // Verify PDF content
    const pdfDoc = pdfWindow.document.querySelector('embed') || pdfWindow.document.querySelector('object')
    if (!pdfDoc || !pdfDoc.src.includes(props.pdfUrl)) {
      throw new Error('PDF content not loaded correctly')
    }

    loading.value = false
    detectPrinters()
  } catch (error) {
    console.error('PDF loading error:', error)
    loading.value = false
    emit('error', {
      type: 'pdf-load-error',
      message: error.message,
      url: props.pdfUrl
    })
  }
}

// Reset loading state when PDF URL changes
watch(() => props.pdfUrl, (newUrl) => {
  try {
    if (!newUrl) {
      throw new Error('PDF URL is empty')
    }
    
    // Validate URL format
    if (!newUrl.startsWith('http') || !newUrl.includes('/pdf/')) {
      throw new Error(`Invalid PDF URL format: ${newUrl}`)
    }

    loading.value = true
    
    // Force iframe reload if URL changes
    const iframe = document.querySelector('iframe')
    if (iframe) {
      iframe.src = newUrl
    }
  } catch (error) {
    console.error('PDF URL validation error:', error)
    emit('error', {
      type: 'pdf-url-error',
      message: error.message,
      url: newUrl
    })
    loading.value = false
  }
}, { immediate: true })

const printerDialog = ref(false)
const availablePrinters = ref([])
const selectedPrinter = ref(null)

// Detect available USB printers
const detectPrinters = async () => {
  try {
    const devices = await navigator.usb.getDevices()
    availablePrinters.value = devices
      .filter(device => device.productName.toLowerCase().includes('printer'))
      .map(device => ({
        id: device.deviceId,
        name: device.productName,
        device
      }))
    
    if (availablePrinters.value.length > 0) {
      printerDialog.value = true
    } else {
      console.warn('No USB printers found')
    }
  } catch (error) {
    console.error('Error detecting printers:', error)
  }
}

// Send PDF to selected printer
const printToPrinter = async () => {
  if (!selectedPrinter.value) return

  try {
    const printer = selectedPrinter.value.device
    await printer.open()
    await printer.selectConfiguration(1)
    await printer.claimInterface(0)

    const iframe = document.querySelector('iframe')
    if (iframe) {
      const pdfBlob = await fetch(iframe.src).then(res => res.blob())
      const arrayBuffer = await pdfBlob.arrayBuffer()
      
      await printer.transferOut(1, arrayBuffer)
      console.log('PDF sent to printer successfully')
    }
  } catch (error) {
    console.error('Error printing:', error)
  } finally {
    if (selectedPrinter.value?.device?.opened) {
      await selectedPrinter.value.device.close()
    }
  }
}

const confirmPrinter = async () => {
  printerDialog.value = false
  await printToPrinter()
  closeDialog()
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
