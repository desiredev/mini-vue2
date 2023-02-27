function defineReactive(obj, key, val) {
  // 递归遍历嵌套对象
  observe(val);

  // 创建Dep实例
  const dep = new Dep()


  Object.defineProperty(obj, key, {
      get() {
          console.log('get', key);
          // 依赖收集
          Dep.target && dep.addDep(Dep.target)
          return val;
      },
      set(newVal) {
          console.log('set', key);
          if (newVal !== val) {
              // 保证如果newVal是对象，再次做响应式处理
              observe(newVal);
              val = newVal;

              dep.notify()
          }
      }
  })
}



function observe(obj) {
  if (typeof obj !== 'object' || obj === null) {
      return
  }

  new Observer(obj)
}

function set() {
  defineReactive(obj, key, val)
}

// 根据传入value的类型做相应的响应式处理
class Observer {
  constructor(value) {
      this.value = value
      if (Array.isArray(value)) {
          // todo
      } else {
          this.walk(value)
      }
  }

  // 对象响应式
  walk(obj) {
      Object.keys(obj).forEach(key => {
          defineReactive(obj, key, obj[key]);
      })
  }
}

function proxy(vm) {
  Object.keys(vm.$data).forEach(key => {
      Object.defineProperty(vm, key, {
          get() {
              return vm.$data[key];
          },
          set(v) {
              vm.$data[key] = v;
          }
      })
  })
}

// KVue类
// 1、对data选项做响应式处理
// 2、编译模板
class KVue {
  constructor(options) {
      this.$options = options
      this.$data = options.data

      // data响应式处理
      observe(this.$data)

      // 代理
      proxy(this)

      // compile
      // new Compile(options.el, this)
      if (options.el) {
          this.$mount(options.el);
      }
  }

  $mount(el) {
      // 获取宿主
      this.$el = document.querySelector(el);

      // 创建updateComponent
      const updateComponent = () => {
          // 获取渲染函数
          const { render } = this.$options;
          const vnode = render.call(this, this.$createElement);
          // vnode变成dom
          this._update(vnode);
          // const parent = this.$el.parentElement
          // parent.insertBefore(el, this.$el.nextSibling)
          // parent.removeChild(this.$el)
          // this.$el = el
      }

      // 创建根组件对应Watcher
      new Watcher(this, updateComponent);
  }

  $createElement(tag, props, children) {
      return { tag, props, children }
  }

  _update(vnode) {
      const prevVnode = this._vnode;
      if (!prevVnode) {
          // init
          this.__patch__(this.$el, vnode);
      } else {
          // update
          this.__patch__(prevVnode, vnode);
      }
  }

  __patch__(oldVnode, vnode) {
      // dom
      if (oldVnode.nodeType) {
          const parent = oldVnode.parentElement; // body
          const refElm = oldVnode.nextSibling;
          const el = this.createElm(vnode);

          parent.insertBefore(el, refElm)
          parent.removeChild(oldVnode);

          // 保存vnode
          this._vnode = vnode;
      } else {
          // update
          // 获取el
          const el = (vnode.el = oldVnode.el)
          if (oldVnode.tag === vnode.tag) {
              // props
              // 获取新旧props 比对
              const oldProps = oldVnode.props || {}
              const newProps = vnode.props || {}
              for (const key in newProps) {
                  const oldValue = oldProps[key]
                  const newValue = newProps[key]
                  if (oldValue !== newValue) {
                      el.setAttribute(key, newValue)
                  }
              }
              // 属性删除
              for (const key in oldProps) {
                  if (!(key in newProps)) {
                      el.removeChild(key)
                  }
              }
              // children
              const oldCh = oldVnode.children
              const newCh = vnode.children
              if (typeof newCh === 'string') {
                  if (typeof oldCh === 'string') {
                      // 新旧文本都存在且不同
                      if (oldCh !== newCh) {
                          el.textContent = newCh
                      }
                  } else {
                      // 以前没有文本
                      el.textContent = newCh
                  }
              } else {
                  // children
                  if (typeof oldCh === 'string') {
                      el.innerHTML = ''
                      newCh.forEach(child => this.createElm(child))
                  } else {
                      // 重排 updateChildren
                      this.updateChildren(el, oldCh, newCh)
                  }
              }

          }
      }
  }

  createElm(vnode) {
      const el = document.createElement(vnode.tag);
      // props
      if (vnode.props) {
          for (const key in vnode.props) {
              const value = vnode.props[key]
              el.setAttribute(key, value)
          }
      }
      // children
      if (vnode.children) {
          if (typeof vnode.children === 'string') {
              // text
              el.textContent = vnode.children
          } else {
              // 递归
              vnode.children.forEach(n => {
                  const child = this.createElm(n)
                  el.appendChild(child);
              })
          }
      }

      vnode.el = el
      return el;
  }

  updateChildren(parentElm, oldCh, newCh) {
      const len = Math.min(oldCh.length, newCh.length)
      for (let i = 0; i < len; i++) {
          this.__patch__(oldCh[i], newCh[i])
      }
      if (newCh.length > oldCh.length) {
          // add
          newCh.slice(len).forEach(child => {
              const el = this.createElm(child)
              parentElm.appendChild(el)
          })
      } else if (newCh.length < oldCh.length) {
          // remove
          oldCh.slice(len).forEach(child => {
              const el = this.createElm(child)
              parentElm.appendChild(el)
          })
      }
  }
}

// 解析模板
// 处理插值、处理指令和事件
// 以上两者初始化和更新
class Compile {
  constructor(el, vm) {
      this.$vm = vm,
          this.$el = document.querySelector(el);

      if (this.$el) {
          this.compile(this.$el)
      }
  }

  compile(el) {
      // 遍历el的子节点，判断他们类型做相应处理
      const childNodes = el.childNodes;
      childNodes.forEach(node => {
          if (node.nodeType === 1) {
              // 元素
              // console.log('元素', node.nodeName);
              // 处理指令和事件
              const attrs = node.attributes;
              Array.from(attrs).forEach(attr => {
                  // k-xxx="abc"
                  const attrName = attr.name;
                  const exp = attr.value;
                  if (attrName.startsWith('k-')) {
                      const dir = attrName.substring(2)
                      this[dir] && this[dir](node, exp)
                  }
              })
          } else if (this.isInter(node)) {
              // 文本
              // console.log('插值', node.textContent);
              this.compileText(node)
          }

          // 递归
          if (node.childNodes) {
              this.compile(node)
          }
      })
  }

  update(node, exp, dir) {
      // 1.初始化
      const fn = this[dir + 'Updater'];
      fn && fn(node, this.$vm[exp])

      // 2.更新
      new Watcher(this.$vm, exp, function(val) {
          fn && fn(node, val)
      })
  }

  text(node, exp) {
      // node.textContent = this.$vm[exp]
      this.update(node, exp, 'text')
  }
  textUpdater(node, value) {
      node.textContent = value
  }

  html(node, exp) {
      // node.innerHTML = this.$vm[exp]
      this.update(node, exp, 'html')
  }
  htmlUpdater(node, value) {
      node.innerHTML = value
  }

  // 编译文本
  compileText(node) {
      // node.textContent = this.$vm[RegExp.$1]
      this.update(node, RegExp.$1, 'text')
  }

  // 是否插值表达式
  isInter(node) {
      return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
  }
}

// 监听器：负责依赖的更新
class Watcher {
  constructor(vm, fn) {
      this.vm = vm
      this.getter = fn

      this.get()

  }

  get() {
      // 触发依赖收集
      Dep.target = this
      this.getter.call(this.vm)
      Dep.target = null
  }

  // 更新方法
  // 未来被Dep调用
  update() {
      // 执行实际的更新操作
      // this.updateFn.call(this.vm, this.vm[this.key])
      this.get()
  }
}

class Dep {
  constructor() {
      // this.deps = []
      this.deps = new Set()
  }

  addDep(dep) {
      this.deps.add(dep)
  }

  notify() {
      this.deps.forEach(dep => dep.update())
  }
}