class Store {
  constructor(options) {
    this._mutations = options.mutations;
    this._actions = options.actions;
    this._warppendGetters = options.getters;
    const store = this;
    const computed = {};
    this.getters = {};
    Object.keys(this._warppendGetters).forEach(key => {
      const fn = store._warppendGetters[key];
      computed[key] = function() {
        return fn(store.state)
      }
      Object.defineProperty(store.getters, key, {
        get: () => store._vm[key]
      })
    })
    this._vm = new Vue({
      data: {
        $$state: options.state
      },
      computed
    })
    
    const {commit,dispatch} = store;
    this.commit = (type, payload) => {
      commit.call(this, type, payload);
    }
    this.dispatch = (type, payload) => {
      dispatch.call(this, type, payload);
    }
  }
  get state() {
    return this._vm.$data.$$state;
  }
  set state(v) {
    console.warn('please use set');
  }
  commit(type, payload) {
    const entry = this._mutations[type];
    if (!entry) {
      console.warn(`unknown mutaions type:${type}`);
      return;
    }
    entry(this.state, payload);
  }
  dispatch(type, payload) {
    const entry = this._actions[type];
    if (!entry) {
      console.warn(`unknown actions type:${type}`);
    }
    entry(this, payload);
  }
}
let Vue;
function install(_Vue) {
  Vue = _Vue;
  Vue.mixin({
    beforeCreate() {
      if (this.$options.store) {
        Vue.prototype.$store = this.$options.store;
      }
    }
  })
}
export default {Store, install};