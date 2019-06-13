import DLake from './components/DLake.vue'

global.service_dlake = function(Vue) {
  // Warning: component name must be globally unique in your host app
  Vue.component('dlake', DLake)
}
