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

      <!-- Print Dialog -->
      <v-dialog v-model="printDialog" max-width="600px">
        <v-card>
          <v-card-title>Print Invoice</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="selectedPrinter"
                  :items="availablePrinters"
                  item-title="name"
                  label="Select Printer"
                  :loading="loadingPrinters"
                  :disabled="loadingPrinters"
                  clearable
                  hint="Select a network printer"
                  persistent-hint
                ></v-select>
              </v-col>
              
              <v-col cols="6">
                <v-select
                  v-model="printSettings.orientation"
                  :items="['Portrait', 'Landscape']"
                  label="Orientation"
                ></v-select>
              </v-col>
              
              <v-col cols="6">
                <v-select
                  v-model="printSettings.paperSize"
                  :items="['A4', 'Letter', 'Legal']"
                  label="Paper Size"
                ></v-select>
              </v-col>
              
              <v-col cols="12">
                <v-checkbox
                  v-model="printSettings.color"
                  label="Print in color"
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-btn color="grey" @click="printDialog = false">Cancel</v-btn>
            <v-btn 
              color="primary" 
              @click="printPdf"
              :loading="printing"
              :disabled="!selectedPrinter || printing"
            >
              Print
            </v-btn>
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
          class="mr-2"
        >
          Close
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="printDialog = true"
          :loading="loadingPrinters"
        >
          <v-icon start>mdi-printer</v-icon>
          Print
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
    // Validate PDF URL and handle cross-origin issues
    if (!props.pdfUrl || !props.pdfUrl.includes('/pdf/')) {
      throw new Error('Invalid PDF URL format')
    }

    // Handle cross-origin iframe access
    try {
      const iframe = document.querySelector('iframe')
      if (!iframe) {
        throw new Error('PDF iframe not found')
      }

      // Set up message channel for cross-origin communication
      const channel = new MessageChannel()
      iframe.contentWindow.postMessage({ type: 'pdf-ready-check' }, '*', [channel.port2])

      channel.port1.onmessage = (event) => {
        if (event.data === 'pdf-ready') {
          loading.value = false
        } else {
          throw new Error('PDF content not loaded correctly')
        }
      }
    } catch (error) {
      console.error('PDF loading error:', error)
      loading.value = false
      emit('error', {
        type: 'pdf-load-error',
        message: error.message,
        url: props.pdfUrl
      })
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

const printDialog = ref(false)
const printing = ref(false)
const loadingPrinters = ref(false)
const availablePrinters = ref([])
const selectedPrinter = ref(null)
const printSettings = ref({
  orientation: 'Portrait',
  paperSize: 'Letter',
  color: false,
  copies: 1
})

// Detect network printers
const detectPrinters = async () => {
  loadingPrinters.value = true
  try {
    // First try to get printers from the system
    if (navigator.userAgent.includes('Windows')) {
      // Windows-specific printer detection
      const printers = await window.electron?.getPrinters()
      if (printers) {
        availablePrinters.value = printers.map(p => ({
          id: p.name,
          name: p.displayName,
          isDefault: p.isDefault
        }))
        return
      }
    }

    // Fallback to network printer discovery
    const response = await fetch('/api/printers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      availablePrinters.value = data.printers.map(p => ({
        id: p.id,
        name: p.name,
        location: p.location
      }))
    } else {
      console.error('Failed to fetch printers:', response.statusText)
    }
  } catch (error) {
    console.error('Error detecting printers:', error)
  } finally {
    loadingPrinters.value = false
  }
}

// Print PDF using selected printer
const printPdf = async () => {
  if (!selectedPrinter.value) return

  printing.value = true
  try {
    const iframe = document.querySelector('iframe')
    if (!iframe || !iframe.contentWindow) {
      throw new Error('PDF iframe not found')
    }

    // Get PDF content
    const pdfWindow = iframe.contentWindow
    const pdfDoc = pdfWindow.document.querySelector('embed') || 
                   pdfWindow.document.querySelector('object')
    
    if (!pdfDoc) {
      throw new Error('PDF content not loaded')
    }

    // Prepare print options
    const printOptions = {
      printerName: selectedPrinter.value.name,
      printBackground: true,
      color: printSettings.value.color,
      landscape: printSettings.value.orientation === 'Landscape',
      copies: printSettings.value.copies,
      pageSize: printSettings.value.paperSize
    }

    // Use Electron printing if available
    if (window.electron) {
      await window.electron.printPDF(pdfDoc.src, printOptions)
    } else {
      // Fallback to browser printing
      pdfWindow.print()
    }

    console.log('PDF printed successfully')
    printDialog.value = false
  } catch (error) {
    console.error('Error printing PDF:', error)
    emit('error', {
      type: 'print-error',
      message: error.message,
      printer: selectedPrinter.value
    })
  } finally {
    printing.value = false
  }
}

// Detect printers when dialog opens
watch(printDialog, (newVal) => {
  if (newVal) {
    detectPrinters()
  }
})

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
