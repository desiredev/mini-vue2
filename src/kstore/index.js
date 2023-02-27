import Vue from 'vue'
import Vuex from './kvuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    count: 0
  },
  mutations: {
    add(state) {
      console.log(2, state, this);
      state.count++
    }
  },
  actions: {
    add({commit}, payload) {
      console.log(345, commit);
      setTimeout(() => {
        commit('add');
      }, 1000);
    }
  },
  getters: {
    doubleCount(state) {
      return state.count * 2;
    }
  }
})
