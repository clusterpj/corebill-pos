// src/composables/useTheme.js
import { ref } from 'vue'
import { useTheme } from 'vuetify'

export function useAppTheme() {
  const theme = useTheme()
  const isDark = ref(theme.global.current.value.dark)

  const toggleTheme = () => {
    theme.global.name.value = isDark.value ? 'posLightTheme' : 'posDarkTheme'
    isDark.value = !isDark.value
  }

  const setTheme = (themeName) => {
    theme.global.name.value = themeName
    isDark.value = theme.global.current.value.dark
  }

  return {
    isDark,
    toggleTheme,
    setTheme,
    currentTheme: theme.global.name
  }
}