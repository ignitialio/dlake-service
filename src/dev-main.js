import Vue from 'vue'
import DLake from './components/DLake.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(DLake),
}).$mount('#app')
