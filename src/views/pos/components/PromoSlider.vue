<template>
  <v-card class="promo-slider h-100" elevation="0" rounded="0">
    <v-carousel
      cycle
      height="100%"
      hide-delimiter-background
      show-arrows="hover"
      interval="6000"
      class="fill-height"
      hide-delimiters
    >
      <v-carousel-item
        v-for="(promo, i) in promos"
        :key="i"
        :src="promo.image"
        cover
      >
        <v-sheet
          class="promo-overlay d-flex align-center justify-center flex-column text-center"
          height="100%"
          width="100%"
        >
          <div class="promo-content">
            <h2 class="text-h3 font-weight-bold mb-4">{{ promo.title }}</h2>
            <div class="text-h5 mb-6">{{ promo.description }}</div>
            <v-chip
              v-if="promo.discount"
              color="error"
              size="x-large"
              class="text-h5 px-8 py-4"
            >
              {{ promo.discount }}
            </v-chip>
          </div>
        </v-sheet>
      </v-carousel-item>
    </v-carousel>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Sample promos data - replace with actual data from your backend
const promos = ref([
  {
    title: 'Fresh Produce Special',
    description: 'All organic fruits and vegetables',
    discount: '15% OFF',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80'
  },
  {
    title: 'Weekly Meal Deal',
    description: 'Buy any main dish and get a free beverage',
    discount: 'FREE DRINK',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80'
  },
  {
    title: 'Family Pack Savings',
    description: 'Perfect for family gatherings',
    discount: 'Save 20%',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80'
  },
  {
    title: 'Daily Fresh Bread',
    description: 'Freshly baked every morning',
    discount: '2 for $5',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80'
  },
  {
    title: 'Happy Hour Special',
    description: 'All smoothies and fresh juices',
    discount: '25% OFF',
    image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&q=80'
  }
])
</script>

<style scoped>
.promo-slider {
  background: transparent;
  width: 100%;
  overflow: hidden;
}

.v-carousel {
  height: 100vh !important;
}

.promo-overlay {
  background: rgba(0, 0, 0, 0.5);
  color: white;
}

.promo-content {
  padding: 2rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 16px;
  backdrop-filter: blur(8px);
  max-width: 80%;
}

.v-carousel__controls {
  background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
}

.text-h3 {
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.text-h5 {
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.v-chip {
  font-weight: 700 !important;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}
</style>
