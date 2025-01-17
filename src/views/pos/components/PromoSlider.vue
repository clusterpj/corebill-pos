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
import { usePromoStore } from '@/stores/promo'

const promoStore = usePromoStore()
const promos = promoStore.promos
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
