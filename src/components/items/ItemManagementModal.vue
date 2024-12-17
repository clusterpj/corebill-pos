<!-- src/components/items/ItemManagementModal.vue -->
<template>
  <v-dialog v-model="dialogVisible" max-width="800" persistent @click:outside="closeDialog">
    <v-card>
      <!-- Add this alert if no store is selected -->
      <v-alert
        v-if="!companyStore.selectedStore"
        type="warning"
        variant="tonal"
        class="ma-4"
      >
        Please select a store before creating new items.
      </v-alert>
    </v-card>
  </v-dialog>
  <v-alert
    v-if="errorMessage"
    type="error"
    variant="tonal"
    closable
    class="mb-4"
    @click:close="errorMessage = null"
  >
    {{ errorMessage }}
  </v-alert>
  <v-dialog
    v-model="dialogVisible"
    max-width="800"
    persistent
    @click:outside="closeDialog"
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        {{ editingItem ? 'Edit Item' : 'New Item' }}
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-card-title>

      <v-card-text>
        <v-form ref="form" @submit.prevent="saveItem">
          <!-- Basic Information -->
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="itemForm.name"
                label="Item Name"
                :rules="[rules.required]"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="itemForm.sku"
                label="SKU"
                :rules="[rules.required]"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="itemForm.price"
                label="Price"
                type="number"
                prefix="$"
                :rules="[rules.required, rules.numeric]"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="itemForm.category_id"
                :items="categories"
                item-title="name"
                item-value="id"
                label="Category"
                :rules="[rules.required]"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="itemForm.stock_level"
                label="Stock Level"
                type="number"
                :rules="[rules.required, rules.numeric]"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="itemForm.reorder_level"
                label="Reorder Level"
                type="number"
                :rules="[rules.numeric]"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="itemForm.description"
                label="Description"
                rows="3"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <!-- Image Upload -->
          <v-row>
            <v-col cols="12">
              <div class="d-flex align-center mb-2">
                <h3 class="text-subtitle-1">Item Image</h3>
                <v-spacer />
                <v-btn
                  color="primary"
                  prepend-icon="mdi-camera"
                  variant="text"
                  @click="triggerImageUpload"
                >
                  Upload Image
                </v-btn>
              </div>
              
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="d-none"
                @change="handleImageUpload"
              />

              <v-card
                v-if="itemForm.image || previewImage"
                variant="outlined"
                class="pa-2"
              >
                <v-img
                  :src="previewImage || itemForm.image"
                  height="200"
                  cover
                  class="bg-grey-lighten-2"
                />
                <div class="d-flex justify-end pa-2">
                  <v-btn
                    color="error"
                    variant="text"
                    size="small"
                    @click="removeImage"
                  >
                    Remove
                  </v-btn>
                </div>
              </v-card>
              <v-card
                v-else
                variant="outlined"
                class="d-flex align-center justify-center"
                height="200"
                style="cursor: pointer"
                @click="triggerImageUpload"
              >
                <div class="text-center">
                  <v-icon size="48" color="grey">mdi-image-plus</v-icon>
                  <div class="text-grey mt-2">Click to add image</div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="error"
          variant="text"
          :disabled="loading"
          @click="closeDialog"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          @click="saveItem"
        >
          {{ editingItem ? 'Update' : 'Create' }} Item
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { usePosStore } from '../../stores/pos-store'
import { logger } from '../../utils/logger'
import { useCompanyStore } from '../../stores/company'

const errorMessage = ref(null)
const companyStore = useCompanyStore()
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  editItem: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'item-saved', 'error'])

const posStore = usePosStore()
const form = ref(null)
const fileInput = ref(null)
const loading = ref(false)
const previewImage = ref(null)

// Form validation rules
const rules = {
  required: v => !!v || 'This field is required',
  numeric: v => !isNaN(parseFloat(v)) && isFinite(v) || 'Must be a number'
}

// Form data
const itemForm = reactive({
  name: '',
  sku: '',
  description: '',
  price: '',
  category_id: null,
  stock_level: 0,
  reorder_level: 0,
  image: null
})

// Computed
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const editingItem = computed(() => props.editItem)
const categories = computed(() => posStore.categoriesForDisplay)

// Watch for edit item changes
watch(() => props.editItem, (newItem) => {
  if (newItem) {
    Object.keys(itemForm).forEach(key => {
      if (key === 'price') {
        itemForm[key] = (newItem[key] / 100).toFixed(2) // Convert cents to dollars
      } else {
        itemForm[key] = newItem[key] || itemForm[key]
      }
    })
    if (newItem.media && newItem.media.length > 0) {
      itemForm.image = newItem.media[0].original_url
    }
  }
}, { immediate: true })

// Methods
function triggerImageUpload() {
  fileInput.value.click()
}

async function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) {
    logger.error('No file selected')
    return
  }

  try {
    // Log file details
    logger.debug('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file')
    }

    // Store file object
    fileObject.value = file
    
    // Create base64 preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target.result
      logger.debug('Image loaded:', {
        resultLength: result.length,
        hasData: !!result
      })

      // Store the full base64 string for now
      previewImage.value = result
    }
    reader.onerror = (e) => {
      logger.error('FileReader error:', e)
      throw new Error('Failed to read image file')
    }
    reader.readAsDataURL(file)

  } catch (error) {
    logger.error('Failed to handle image upload:', error)
    errorMessage.value = error.message || 'Failed to handle image upload'
  }
}

// Inside saveItem function, after successful item creation:

// Step 2: If we have an image, upload it using the item ID
if (fileObject.value && previewImage.value) {
  try {
    logger.debug('Preparing image upload:', {
      fileName: fileObject.value.name,
      itemId: itemResponse.item.id,
      hasPreviewImage: !!previewImage.value
    })

    // Get the base64 data without the prefix
    const base64Data = previewImage.value.split(',')[1]
    
    const pictureData = {
      picture: JSON.stringify({
        name: fileObject.value.name,
        data: base64Data,
        item_id: itemResponse.item.id
      })
    }

    logger.debug('Picture data prepared:', {
      hasName: !!pictureData.picture.name,
      hasData: !!pictureData.picture.data,
      itemId: pictureData.picture.item_id
    })

    // Make the upload request
    const imageResponse = await posStore.uploadItemPicture(pictureData)
    
    if (imageResponse.success) {
      window.toastr?.['success']('Image uploaded successfully')
      logger.info('Image upload successful for item:', itemResponse.item.id)
    } else {
      logger.error('Image upload response indicated failure:', imageResponse)
      throw new Error('Image upload failed')
    }
  } catch (imageError) {
    logger.error('Image upload error:', {
      error: imageError,
      itemId: itemResponse.item.id,
      fileName: fileObject.value.name
    })
    window.toastr?.['error']('Failed to upload image: ' + (imageError.message || 'Unknown error'))
  }
}

function removeImage() {
  itemForm.image = null
  previewImage.value = null
  fileInput.value.value = ''
}

async function saveItem() {
  if (!form.value) return
  const { valid } = await form.value.validate()
  if (!valid) return

  if (!companyStore.selectedStore) {
    errorMessage.value = 'No store selected. Please select a store first.'
    return
  }

  loading.value = true
  try {
    // Step 1: Create/Update the item first
    const itemData = {
      name: itemForm.name,
      description: itemForm.description || '',
      price: Math.round(parseFloat(itemForm.price) * 100),
      unit_id: itemForm.unit?.id,
      item_category_id: itemForm.category_id,
      unit: itemForm.unit,
      sku: itemForm.sku,  // Adding SKU field
      allow_pos: true,
      avalara_bool: false,
      avalara_discount_type: {
        name: "None",
        value: "0"
      },
      avalara_sale_type: {
        name: "Retail",
        value: "Retail"
      },
      avalara_service_type: null,
      avalara_service_type_name: "",
      avalara_service_types: [],
      avalara_type: null,
      no_taxable: false,
      retentions: null,
      retentions_bool: false,
      tax_inclusion: false,
      taxes: [],
      item_categories: [{
        id: itemForm.category_id,
        name: posStore.categories.find(c => c.item_category_id === itemForm.category_id)?.name || '',
        is_group: 1,
        is_item: 1
      }],
      item_groups: [],
      item_section: [],
      item_store: [{
        id: companyStore.selectedStore,
        name: companyStore.storesForDisplay.find(s => s.value === companyStore.selectedStore)?.title || '',
        company_name: companyStore.currentCustomer?.name || 'xyz',
        description: ''
      }]
    }

    let itemResponse
    if (editingItem.value) {
      itemResponse = await posStore.updateItem(editingItem.value.id, itemData)
    } else {
      itemResponse = await posStore.createItem(itemData)
    }

    // Check if we got a valid item ID back
    if (!itemResponse?.item?.id) {
      throw new Error('Failed to get item ID from response')
    }

// Step 2: If we have an image, upload it using the item ID
if (fileObject.value && previewImage.value) {
  try {
    const pictureData = {
      picture: JSON.stringify({
        name: fileObject.value.name,
        data: previewImage.value, // This should now be just the base64 string without the prefix
        item_id: itemResponse.item.id
      })
    }
    
    logger.debug('Attempting to upload picture:', {
      itemId: itemResponse.item.id,
      fileName: fileObject.value.name,
      hasData: !!previewImage.value
    })

    const imageResponse = await posStore.uploadItemPicture(pictureData)
    
    if (imageResponse.success) {
      window.toastr?.['success']('Image uploaded successfully')
      logger.info('Image upload successful for item:', itemResponse.item.id)
    } else {
      throw new Error('Image upload failed')
    }
  } catch (imageError) {
    window.toastr?.['error']('Failed to upload image: ' + (imageError.message || 'Unknown error'))
    logger.error('Image upload failed:', {
      error: imageError,
      itemId: itemResponse.item.id,
      fileName: fileObject.value.name
    })
  }
}

    // Show success message for item creation/update
    window.toastr?.['success'](
      editingItem.value 
        ? 'Item updated successfully' 
        : 'Item created successfully'
    )

    logger.info(`Item ${editingItem.value ? 'updated' : 'created'} successfully:`, {
      itemId: itemResponse.item.id,
      name: itemResponse.item.name
    })

    emit('item-saved', itemResponse)
    closeDialog()

  } catch (error) {
    // Show error message
    window.toastr?.['error'](error.message || 'Failed to save item')
    logger.error('Failed to save item:', {
      error,
      formData: itemForm,
      isEdit: !!editingItem.value
    })
    errorMessage.value = error.message || 'Failed to save item'
  } finally {
    loading.value = false
  }
}
function closeDialog() {
  dialogVisible.value = false
  form.value?.reset()
  previewImage.value = null
  errorMessage.value = null
  Object.keys(itemForm).forEach(key => {
    itemForm[key] = key === 'stock_level' || key === 'reorder_level' ? 0 : ''
  })
  emit('update:modelValue', false) // Ensure modal closes
}
</script>
