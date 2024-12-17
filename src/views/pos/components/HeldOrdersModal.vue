<!-- src/views/pos/components/HeldOrdersModal.vue -->
<template>
  <div class="held-orders-container">
    <v-btn
      color="primary"
      prepend-icon="mdi-clipboard-list"
      @click="$emit('update:modelValue', true)"
      :disabled="disabled"
      class="text-none px-6 text-capitalize"
      rounded="pill"
      :elevation="$vuetify.display.mobile ? 1 : 2"
      size="large"
      :block="$vuetify.display.mobile"
    >
      <span class="text-subtitle-1 font-weight-medium">ORDERS</span>
    </v-btn>

    <v-dialog
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      fullscreen
      transition="dialog-bottom-transition"
      :scrim="true"
      :persistent="true"
    >
    <v-card class="h-100">
      <!-- Responsive App Bar -->
      <v-app-bar
        color="primary"
        density="comfortable"
        elevation="2"
      >
        <v-app-bar-title class="text-h6 font-weight-medium">
          Held Orders
        </v-app-bar-title>
        <v-spacer />
        <v-btn
          color="primary"
          prepend-icon="mdi-clipboard-list"
          class="text-none px-6"
          rounded="pill"
          elevation="2"
          size="large"
          @click="$emit('update:modelValue', false)"
        >
          ORDERS
        </v-btn>
      </v-app-bar>

      <!-- Main Content Area -->
      <v-main class="bg-grey-lighten-4">
        <v-container fluid class="fill-height pa-4">
          <v-row>
            <v-col cols="12">
              <HeldOrdersModalComponent
                :model-value="modelValue"
                @update:model-value="$emit('update:modelValue', $event)"
                class="elevation-1 rounded-lg"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-main>

      <!-- Bottom Navigation (Mobile Only) -->
      <v-bottom-navigation
        v-show="$vuetify.display.mobile"
        elevation="2"
        color="primary"
      >
        <v-btn @click="$emit('update:modelValue', false)">
          <v-icon>mdi-close</v-icon>
          Close
        </v-btn>
      </v-bottom-navigation>
    </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { useDisplay } from 'vuetify'
import HeldOrdersModalComponent from './held-orders/HeldOrdersModal.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

defineEmits(['update:modelValue'])
</script>
