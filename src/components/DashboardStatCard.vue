<!-- src/components/DashboardStatCard.vue -->
<template>
    <v-card>
      <v-card-text class="d-flex align-center">
        <v-icon :color="color" size="48" class="mr-4">{{ icon }}</v-icon>
        <div>
          <div class="text-h5">{{ title }}</div>
          <div class="text-h4 font-weight-bold">{{ value }}</div>
        </div>
      </v-card-text>
    </v-card>
  </template>
  
  <script setup>
  defineProps({
    title: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: 'primary'
    }
  })
  </script>