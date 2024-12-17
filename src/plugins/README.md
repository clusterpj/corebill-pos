# CorePOS Plugins Documentation

## Overview
This directory contains Vue.js plugins that extend and configure the application's core functionality, including component registration, UI framework setup, and font loading.

## Plugins

### 1. components.js
A global component registration plugin for CorePOS.

**Purpose:**
- Automatically register core components across the application
- Simplify component usage without manual imports

**Registered Components:**
- `BaseLayout`: Main application layout
- `AppButton`: Reusable button component
- `ErrorBoundary`: Global error handling component
- `LoadingState`: Flexible loading indicator

**Usage:**
```javascript
// In main.js or app initialization
app.use(ComponentPlugin)
```

### 2. vuetify.js
Vuetify configuration and theming plugin.

**Features:**
- Full Vuetify component and directive registration
- Material Design Icons (MDI) icon set
- Custom light theme configuration

**Theme Colors:**
- Primary: #1976D2 (Blue)
- Secondary: #424242 (Dark Grey)
- Accent: #82B1FF (Light Blue)
- Error: #FF5252 (Red)
- Info: #2196F3 (Bright Blue)
- Success: #4CAF50 (Green)
- Warning: #FFC107 (Amber)

**Usage:**
```javascript
// In main.js or app initialization
app.use(VuetifyPlugin)
```

### 3. webfontloader.js
Asynchronous web font loading utility.

**Features:**
- Dynamic font loading using WebFontLoader
- Google Fonts integration
- Roboto font family loading

**Loaded Font:**
- Roboto (Weights: 100, 300, 400, 500, 700, 900)

**Usage:**
```javascript
// In main.js or app initialization
await loadFonts()
```

## Best Practices
- Modular plugin design
- Async font loading
- Centralized theme configuration
- Easy component registration

## Dependencies
- Vue 3
- Vuetify 3
- WebFontLoader
- Material Design Icons
