<!-- src/views/pos/components/products/GridSettings.vue -->
<template>
  <div class="grid-settings pa-4">
    <v-card flat class="mb-6">
      <v-card-text class="text-body-1">
        Customize how products are displayed in your POS grid. Adjust the layout, number of items per row, and number of rows to optimize for your screen size and workflow.
      </v-card-text>
    </v-card>
    <v-slide-x-transition>
      <div class="d-flex align-center">
        <v-tooltip
          location="top"
          text="Set how many product cards appear in each row of the grid"
        >
          <template v-slot:activator="{ props }">
            <v-select
              v-bind="props"
              v-model="localColumns"
              :items="columnOptions"
              label="Items per row"
              density="compact"
              hide-details
              variant="outlined"
              class="grid-select elevation-1"
              @update:model-value="updateColumns"
              bg-color="white"
              :menu-props="{ maxHeight: 200 }"
            >
              <template v-slot:prepend-inner>
                <v-icon size="small" color="primary">mdi-view-grid-outline</v-icon>
              </template>
            </v-select>
          </template>
        </v-tooltip>

        <v-tooltip
          location="top"
          text="Set how many rows of products to display before pagination"
        >
          <template v-slot:activator="{ props }">
            <v-select
              v-bind="props"
              v-model="localRows"
              :items="rowOptions"
              label="Rows"
              density="compact"
              hide-details
              variant="outlined"
              class="grid-select me-3 mb-2 elevation-1"
              @update:model-value="updateRows"
              bg-color="white"
              :menu-props="{ maxHeight: 200 }"
            >
              <template v-slot:prepend-inner>
                <v-icon size="small" color="primary">mdi-view-sequential</v-icon>
              </template>
            </v-select>
          </template>
        </v-tooltip>

        <v-tooltip
          location="top"
          text="Choose how products are displayed: Large (spacious), Compact (smaller cards), or List view"
        >
          <template v-slot:activator="{ props }">
            <v-btn-toggle
              v-bind="props"
              v-model="localLayout"
              mandatory
              density="compact"
              rounded="lg"
              class="grid-toggle mb-2 elevation-1"
              @update:model-value="updateLayout"
            >
              <v-btn
                value="comfortable"
                size="small"
                prepend-icon="mdi-view-grid"
                class="grid-btn"
                :ripple="false"
              >
                <span class="d-none d-sm-inline">Large</span>
                <v-icon class="d-sm-none">mdi-view-grid</v-icon>
              </v-btn>
              <v-btn
                value="compact"
                size="small"
                prepend-icon="mdi-view-grid-compact"
                class="grid-btn"
                :ripple="false"
              >
                <span class="d-none d-sm-inline">Compact</span>
                <v-icon class="d-sm-none">mdi-view-grid-compact</v-icon>
              </v-btn>
              <v-btn
                value="list"
                size="small"
                prepend-icon="mdi-view-list"
                class="grid-btn"
                :ripple="false"
              >
                <span class="d-none d-sm-inline">List</span>
                <v-icon class="d-sm-none">mdi-view-list</v-icon>
              </v-btn>
            </v-btn-toggle>
          </template>
        </v-tooltip>

        <v-tooltip
          location="top"
          text="Reset to default settings"
        >
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-refresh"
              variant="text"
              size="small"
              color="grey-darken-1"
              class="ms-1"
              @click="resetToDefaults"
            />
          </template>
        </v-tooltip>
      </div>
    </v-slide-x-transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])
const { mobile } = useDisplay()

const defaultSettings = {
  layout: 'comfortable',
  columns: 4,
  rows: -1
}

const localLayout = ref(props.modelValue.layout)
const localColumns = ref(props.modelValue.columns)
const localRows = ref(props.modelValue.rows || defaultSettings.rows)

const columnOptions = [
  { title: '2 Items', value: 2 },
  { title: '4 Items', value: 4 },
  { title: '6 Items', value: 6 },
  { title: '8 Items', value: 8 }
]

const rowOptions = [
  { title: '2 Rows', value: 2 },
  { title: '3 Rows', value: 3 },
  { title: '4 Rows', value: 4 },
  { title: 'Show All', value: -1 }
]

watch(() => props.modelValue, (newValue) => {
  localLayout.value = newValue.layout
  localColumns.value = newValue.columns
  localRows.value = newValue.rows || defaultSettings.rows
}, { deep: true })

const updateLayout = (value) => {
  const newSettings = {
    ...props.modelValue,
    layout: value,
  }
  
  // Set default columns based on layout
  if (value === 'list') {
    newSettings.columns = 2
  } else {
    newSettings.columns = 4
  }
  
  // Always show all rows by default
  newSettings.rows = -1
  
  emit('update:modelValue', newSettings)
}

const updateColumns = (value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    columns: value
  })
}

const updateRows = (value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    rows: value
  })
}

const resetToDefaults = () => {
  emit('update:modelValue', { ...defaultSettings })
}
</script>

<style scoped>
.grid-settings {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.grid-select {
  width: 140px;
  transition: all 0.3s ease;
  margin-right: 6px;
}

.grid-toggle {
  height: 40px;
  transition: all 0.3s ease;
}

.grid-btn {
  min-width: 120px !important;
  padding: 0 8px !important;
  transition: all 0.2s ease;
}

:deep(.v-select .v-field__input) {
  min-height: 40px;
  padding-top: 0;
  padding-bottom: 0;
}

:deep(.v-select .v-field) {
  height: 40px;
  transition: all 0.3s ease;
}

:deep(.v-btn--size-small) {
  letter-spacing: normal;
}

:deep(.v-select .v-field__input) {
  font-size: 14px;
}

:deep(.v-select .v-field__label) {
  font-size: 14px;
  margin-top: -8px;
}

:deep(.v-field--variant-outlined .v-field__outline) {
  --v-field-border-width: 1.5px;
}

:deep(.v-field--variant-outlined:hover .v-field__outline) {
  --v-field-border-width: 2px;
}

:deep(.v-field--variant-outlined .v-field__outline__start) {
  border-color: rgba(0, 0, 0, 0.12);
}

:deep(.v-field--variant-outlined .v-field__outline__end) {
  border-color: rgba(0, 0, 0, 0.12);
}

:deep(.v-field.v-field--appended) {
  --v-field-padding-end: 8px;
}

:deep(.v-select__selection) {
  margin-top: 8px;
}

/* Mobile Optimizations */
@media (max-width: 600px) {
  .grid-settings {
    justify-content: flex-start;
  }

  .grid-select {
    width: 95px;
    margin-right: 4px;
  }

  .grid-btn {
    min-width: 40px !important;
    padding: 0 4px !important;
  }

  :deep(.v-select .v-field__input) {
    font-size: 13px;
  }
}

/* Hover Effects */
.grid-select:hover :deep(.v-field),
.grid-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

:deep(.v-btn-toggle .v-btn--active) {
  transform: scale(1.02);
}
</style>
