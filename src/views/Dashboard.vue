<!-- src/views/Dashboard.vue -->
<template>
  <div class="pa-6">
    <h1 class="text-h4 mb-6">Dashboard</h1>
    <v-row>
      <v-col cols="12" sm="6" lg="3">
        <DashboardStatCard
          title="Today's Sales"
          :value="formatCurrency(todaySales)"
          icon="mdi-cash-multiple"
          color="primary"
          loading-key="todaySales"
        />
      </v-col>
      
      <v-col cols="12" sm="6" lg="3">
        <DashboardStatCard
          title="Orders"
          :value="ordersCount"
          icon="mdi-cart"
          color="secondary"
          loading-key="ordersCount"
        />
      </v-col>
      
      <v-col cols="12" sm="6" lg="3">
        <DashboardStatCard
          title="Active Customers"
          :value="activeCustomersCount"
          icon="mdi-account-group"
          color="info"
          loading-key="activeCustomersCount"
        />
      </v-col>
      
      <v-col cols="12" sm="6" lg="3">
        <DashboardStatCard
          title="Products"
          :value="productsCount"
          icon="mdi-package"
          color="warning"
          loading-key="productsCount"
        />
      </v-col>
    </v-row>

    <v-row class="mt-6">
      <v-col cols="12" md="8">
        <SalesChart 
          :data="salesChartData" 
          @period-change="handlePeriodChange"
        />
      </v-col>
      <v-col cols="12" md="4">
        <TopProducts :products="topProducts" />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useLoadingStore } from '@/stores/loading'
import DashboardStatCard from '@/components/DashboardStatCard.vue'
import SalesChart from '@/components/SalesChart.vue'
import TopProducts from '@/components/TopProducts.vue'
import api from '@/services/api'
import { apiConfig } from '@/services/api/config'

const loadingStore = useLoadingStore()

const todaySales = ref(0)
const ordersCount = ref(0)
const activeCustomersCount = ref(0)
const productsCount = ref(0)
const salesChartData = ref([])
const topProducts = ref([])
const currentChartPeriod = ref('week')

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
}

async function fetchDashboardData() {
  try {
    loadingStore.startLoading(['todaySales', 'ordersCount', 'activeCustomersCount', 'productsCount'])
    
    const [
      todaySalesResponse,
      ordersCountResponse, 
      activeCustomersResponse,
      productsCountResponse
    ] = await Promise.all([
      api.get(apiConfig.endpoints.dashboard.todaySales),
      api.get(apiConfig.endpoints.dashboard.ordersCount),
      api.get(apiConfig.endpoints.dashboard.activeCustomers),
      api.get(apiConfig.endpoints.dashboard.productsCount)
    ])

    todaySales.value = todaySalesResponse.data.totalSales
    ordersCount.value = ordersCountResponse.data.count
    activeCustomersCount.value = activeCustomersResponse.data.count
    productsCount.value = productsCountResponse.data.count

    await Promise.all([
      fetchSalesChartData(),
      fetchTopProducts()
    ])
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    // Error handling will be managed by the API interceptor
  } finally {
    loadingStore.stopLoading(['todaySales', 'ordersCount', 'activeCustomersCount', 'productsCount'])
  }
}

async function fetchSalesChartData() {
  try {
    loadingStore.startLoading(['salesChart'])
    const response = await api.get(`${apiConfig.endpoints.dashboard.salesChart}?period=${currentChartPeriod.value}`)
    salesChartData.value = response.data
  } catch (error) {
    console.error('Failed to fetch sales chart data:', error)
  } finally {
    loadingStore.stopLoading(['salesChart'])
  }
}

async function fetchTopProducts() {
  try {
    loadingStore.startLoading(['topProducts'])
    const response = await api.get(apiConfig.endpoints.dashboard.topProducts)
    topProducts.value = response.data
  } catch (error) {
    console.error('Failed to fetch top products:', error)
  } finally {
    loadingStore.stopLoading(['topProducts'])
  }
}

async function handlePeriodChange(period) {
  currentChartPeriod.value = period
  await fetchSalesChartData()
}

onMounted(() => {
  fetchDashboardData()
})
</script>
