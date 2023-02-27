import Link from "./krouter-link";
import View from "./krouter-view";
let Vue;
class VueRouter {
  constructor(options) {
    this.$options = options;
    this.current = window.location.hash.slice(1) || '/';
    Vue.util.defineReactive(this, 'matched', []);
    // this.matche()
    addEventListener('load', this.onHashchange.bind(this))
    addEventListener('hashchange', this.onHashchange.bind(this))
  }
  onHashchange() {
    this.current = window.location.hash.slice(1);
    this.matched = [];
    this.matche();
  }
  matche(routes) {
    routes = routes || this.$options.routes;
    console.log(12, this);
    for (const route of routes) {
      console.log(2, route);
      if (route.path === '/' && this.current === '/') {
        this.matched.push(route);
        return
      }
      if (route.path !== '/' && this.current.indexOf(route.path) !== -1) {
        this.matched.push(route);
        if (route.children) {
          this.matche(route.children);
        }
        return
      }
    }
  }
}



VueRouter.install = function(_Vue) {
  Vue = _Vue;
  Vue.mixin({
    beforeCreate() {
      if (this.$options.router) {
        Vue.prototype.$router = this.$options.router;
      }
    }
  })
  Vue.component('router-link', Link);
  Vue.component('router-view', View);
}

export default VueRouter;