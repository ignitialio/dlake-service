import Vue from 'vue'
import Dlake from '../src/components/Dlake.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(Dlake),
}).$mount('#app')
