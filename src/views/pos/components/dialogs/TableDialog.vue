<template>
  <v-dialog v-model="showTableDialog" max-width="500px">
    <v-card>
      <v-card-title>Select Tables</v-card-title>
      <v-card-text>
        <v-container>
          <!-- Loading State -->
          <v-row v-if="loading">
            <v-col cols="12" class="text-center">
              <v-progress-circular indeterminate></v-progress-circular>
            </v-col>
          </v-row>

          <!-- Error State -->
          <v-row v-else-if="error">
            <v-col cols="12">
              <v-alert type="error" variant="tonal">
                {{ error }}
              </v-alert>
            </v-col>
          </v-row>

          <!-- Tables Grid -->
          <v-row v-else>
            <v-col
              v-for="table in tables"
              :key="table.id"
              cols="4"
              sm="3"
              md="2"
            >
              <v-btn
                block
                :color="getTableColor(table)"
                @click="handleTableSelect(table)"
                :disabled="table.is_occupied && !isTableSelected(table)"
                variant="outlined"
                class="mb-2 table-btn"
              >
                {{ table.name }}
                <v-tooltip activator="parent" location="top">
                  {{ getTableTooltip(table) }}
                </v-tooltip>
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="confirmSelection">
          Confirm
        </v-btn>
        <v-btn color="error" @click="closeDialog">
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTableManagement } from '../../composables/useTableManagement'

const {
  loading,
  error,
  getTables,
  isTableOccupied
} = useTableManagement()

// State
const showTableDialog = ref(false)
const tables = ref([])
const selectedTables = ref([])

// Methods
const isTableSelected = (table) => {
  return selectedTables.value.some(t => t.id === table.id)
}

const getTableColor = (table) => {
  if (isTableSelected(table)) return 'primary'
  if (table.is_occupied) return 'error'
  return ''
}

const getTableTooltip = (table) => {
  if (isTableSelected(table)) return 'Selected'
  if (table.is_occupied) return 'Table Occupied'
  return 'Available'
}

const handleTableSelect = (table) => {
  if (!table.is_occupied || isTableSelected(table)) {
    const index = selectedTables.value.findIndex(t => t.id === table.id)
    if (index >= 0) {
      selectedTables.value.splice(index, 1)
    } else {
      selectedTables.value.push(table)
    }
  }
}

const confirmSelection = () => {
  closeTableDialog()
}

const closeDialog = () => {
  showTableDialog.value = false
}

// Load tables on mount
onMounted(async () => {
  try {
    tables.value = await getTables()
  } catch (err) {
    console.error('Failed to load tables:', err)
  }
})
</script>

<style scoped>
.table-btn {
  height: 60px;
  position: relative;
}

.table-btn.v-btn--disabled {
  opacity: 0.8;
  pointer-events: auto;
  cursor: not-allowed;
}
</style>
