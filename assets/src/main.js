// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import resource from 'vue-resource'
import VueAsyncData from  'vue-async-data'

Vue.config.productionTip = false
Vue.use(VueAsyncData)

/* eslint-disable no-new */
Vue.use(resource)
/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  components: { App }
})
