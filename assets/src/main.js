import Vue from 'vue'
import App from './App'
import resource from 'vue-resource'
import VueAsyncData from  'vue-async-data'

// use globally
// you can also just use `VueAsyncData.mixin` where needed
Vue.use(VueAsyncData);

/* eslint-disable no-new */
Vue.use(resource);
new Vue({
  el: 'body',
  components: { App }
})
