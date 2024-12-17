<!-- src/views/pos/components/ItemManagementModal.vue -->
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
  import { usePosStore } from '@/stores/pos-store'
  import { logger } from '@/utils/logger'
  import { useCompanyStore } from '@/stores/company'

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
  
  const emit = defineEmits(['update:modelValue', 'item-saved'])
  
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
    if (!file) return
  
    try {
      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => {
        previewImage.value = e.target.result
      }
      reader.readAsDataURL(file)
  
      // Store file for upload
      itemForm.image = file
    } catch (error) {
      logger.error('Failed to handle image upload:', error)
    }
  }
  
  function removeImage() {
    itemForm.image = null
    previewImage.value = null
    fileInput.value.value = ''
  }
  
// In ItemManagementModal.vue
// In ItemManagementModal.vue
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
    // Create item data object matching the CoreBill structure
    const itemData = {
      name: itemForm.name,
      description: itemForm.description || '',
      price: Math.round(parseFloat(itemForm.price) * 100),
      unit_id: null,
      item_category_id: itemForm.category_id,
      unit: null,
      allow_pos: true,
      allow_taxes: false,
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
      // Categories and store associations
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
        company_name: 'xyz', // This should come from your company store
        description: ''
      }]
    }

    if (itemForm.image instanceof File) {
  const formData = new FormData()
  
  // Append all the fields in the correct format
  formData.append('name', itemData.name)
  formData.append('description', itemData.description)
  formData.append('price', itemData.price)
  formData.append('unit_id', itemData.unit_id)
  formData.append('item_category_id', itemData.item_category_id)
  formData.append('allow_pos', itemData.allow_pos)
  formData.append('allow_taxes', itemData.allow_taxes)
  formData.append('avalara_bool', itemData.avalara_bool)
  formData.append('no_taxable', itemData.no_taxable)
  formData.append('retentions_bool', itemData.retentions_bool)
  formData.append('tax_inclusion', itemData.tax_inclusion)

  // Handle objects that need to be stringified
  formData.append('avalara_discount_type', JSON.stringify(itemData.avalara_discount_type))
  formData.append('avalara_sale_type', JSON.stringify(itemData.avalara_sale_type))
  formData.append('item_categories', JSON.stringify(itemData.item_categories))
  formData.append('item_store', JSON.stringify(itemData.item_store))
  formData.append('item_groups', JSON.stringify(itemData.item_groups))
  formData.append('item_section', JSON.stringify(itemData.item_section))
  formData.append('taxes', JSON.stringify(itemData.taxes))

  // Append arrays empty if they're null
  formData.append('avalara_service_types', JSON.stringify([]))

  // Append null values
  formData.append('avalara_service_type', '')
  formData.append('avalara_service_type_name', '')
  formData.append('avalara_type', '')
  formData.append('retentions', '')
  formData.append('unit', '')

  // Append the image last
  formData.append('image', itemForm.image)

  // Add some debug logging
  logger.debug('FormData entries:', {
    name: formData.get('name'),
    price: formData.get('price'),
    item_store: formData.get('item_store'),
    image: formData.get('image')
  })

  // Use the FormData instead of the JSON
  itemData = formData
}

let response
if (editingItem.value) {
  response = await posStore.updateItem(editingItem.value.id, itemData)
} else {
  response = await posStore.createItem(itemData)
}

    if (response.success) {
      emit('item-saved', response)
      closeDialog()
    } else {
      throw new Error(response.message || 'Failed to save item')
    }
  } catch (error) {
    logger.error('Failed to save item:', error)
    errorMessage.value = error.message || 'Failed to save item'
  } finally {
    loading.value = false
  }
}
  
function closeDialog() {
  dialogVisible.value = false
  form.value?.reset()
  previewImage.value = null
  errorMessage.value = null // Clear error message
  Object.keys(itemForm).forEach(key => {
    itemForm[key] = key === 'stock_level' || key === 'reorder_level' ? 0 : ''
  })
}
</script>