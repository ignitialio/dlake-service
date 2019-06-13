import DLake from './components/DLake.vue'

global.iios_dlake = function(Vue) {
  // Warning: component name must be globally unique in your host app
  Vue.component('dlake', DLake)
}
