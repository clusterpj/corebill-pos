<!-- src/views/pos/components/held-orders/components/DeleteConfirmationDialog.vue -->
<template>
  <v-dialog 
    :model-value="modelValue" 
    @update:model-value="$emit('update:modelValue', $event)" 
    max-width="460"
    persistent
    transition="dialog-bottom-transition"
  >
    <v-card>
      <v-toolbar
        color="error"
        density="comfortable"
      >
        <v-toolbar-title class="text-h6 font-weight-medium">
          <v-icon start icon="mdi-alert" class="mr-2"></v-icon>
          Confirm Delete
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text class="pt-4">
        <p class="text-body-1 mb-4">Are you sure you want to delete this order? This action cannot be undone.</p>
        
        <v-alert
          v-if="orderDescription"
          type="warning"
          variant="tonal"
          border="start"
          class="mb-0"
          density="comfortable"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-information" class="mb-1"></v-icon>
          </template>
          <div class="text-subtitle-2 font-weight-medium mb-1">Order Details</div>
          <div class="text-body-2">{{ orderDescription }}</div>
        </v-alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="grey-darken-1"
          variant="text"
          @click="$emit('update:modelValue', false)"
          :disabled="loading"
          class="mr-2"
        >
          Cancel
        </v-btn>
        <v-btn
          color="error"
          variant="elevated"
          @click="$emit('confirm')"
          :loading="loading"
          :disabled="loading"
        >
          <v-icon start icon="mdi-delete" class="mr-1"></v-icon>
          Delete Order
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  orderDescription: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue', 'confirm'])
</script>

<style scoped>
.v-card-text p {
  margin-bottom: 16px;
}
</style>
