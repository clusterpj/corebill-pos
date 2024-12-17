<!-- src/components/SalesChart.vue -->
<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      Sales Overview
      <v-select
        v-model="selectedPeriod"
        :items="periods"
        density="compact"
        variant="outlined"
        hide-details
        class="period-select"
        style="max-width: 150px"
      ></v-select>
    </v-card-title>
    <v-card-text>
      <v-sheet class="pa-4">
        <v-chart class="chart" :option="chartOption" autoresize />
      </v-sheet>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent
])

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  }
})

const selectedPeriod = ref('week')
const periods = [
  { title: 'Week', value: 'week' },
  { title: 'Month', value: 'month' },
  { title: 'Year', value: 'year' }
]

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      const [param] = params
      return `${param.name}<br/>${param.marker}Sales: $${param.value}`
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: props.data.map(item => item.date)
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: (value) => `$${value}`
    }
  },
  series: [
    {
      name: 'Sales',
      type: 'line',
      smooth: true,
      data: props.data.map(item => item.amount),
      areaStyle: {
        opacity: 0.1
      },
      lineStyle: {
        width: 3
      },
      itemStyle: {
        color: '#1867C0'
      }
    }
  ]
}))

// Watch for period changes to emit event for data refresh
watch(selectedPeriod, (newPeriod) => {
  emit('period-change', newPeriod)
})

const emit = defineEmits(['period-change'])
</script>

<style scoped>
.chart {
  height: 400px;
}
.period-select {
  flex-shrink: 0;
}
</style>
