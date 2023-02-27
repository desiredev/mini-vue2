export default {
  render(h) {
    this.$vnode.data.routerView = true;
    let dep = 0;
    let parent = this.$parent;
    console.log('this---', parent);
    while(parent) {
      const vnodeData = parent.$vnode && parent.$vnode.data;
      if (vnodeData) {
        if (vnodeData.routerView) {
          dep++;
        }
      }
      parent = parent.$parent
    }
    let component = null;
    //  console.log(333333, dep);
     const route = this.$router.matched[dep]
     if (route) {
       component = route.component
     }
    return h(component)
  }
}