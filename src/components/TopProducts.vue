<!-- src/components/TopProducts.vue -->
<template>
    <v-card>
      <v-card-title>Top Products</v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item v-for="product in products" :key="product.id">
            <v-list-item-content>
              <v-list-item-title>{{ product.name }}</v-list-item-title>
              <v-list-item-subtitle>Sold: {{ product.sold }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </template>
  
  <script setup>
  defineProps({
    products: {
      type: Array,
      required: true
    }
  })
  </script>