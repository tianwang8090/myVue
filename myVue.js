/**
 * vue实例
 * @param {Object} options 
 */
function myVue(options) {
  this._init(options);
}

/**
 * 初始化实例
 */
myVue.prototype._init = function (options) {
  this.$options = options;
  this.$el = document.querySelector(options.el);
  this.$data = options.data;
  this.$methods = options.methods;
  // 保存data各个属性的绑定关系
  this._binding = {};
  
  this._obverse(this.$data);
  this._complie(this.$el);
}

/**
 * 重写data，拦截get/set
 */
myVue.prototype._obverse = function (obj) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      this._binding[key] = {
        _directives: []
      };
      let binding = this._binding[key];
      let value = obj[key];
      if (typeof value === "object") {
        this._obverse(value);
      }
      Object.defineProperty(this.$data, key, {
        enumerable: true,
        configurable: true,
        get: function () {
          return value;
        },
        set: function (newVal) {
          if (value !== newVal) {
            value = newVal;
            // 触发绑定响应
            binding._directives.forEach(function (item) {
              item.update();
            })
          }
        }
      })
    }
  }
}

/**
 * 解析模板view，添加订阅者，实现View -> Model 的绑定
 */
myVue.prototype._complie = function (root) {
  var _this = this;
  var nodes = root.children;
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    if (node.children.length) {
      this._complie(node);
    }
    if (node.hasAttribute("v-click")) {
      node.onclick = (function() {
        var attrVal = node.getAttribute("v-click");
        // 绑定data为methods的作用域
        return _this.$methods[attrVal].bind(_this.$data);
      })();
    }
    if (node.hasAttribute("v-model") && (node.tagName === "INPUT" || node.tagName === "TEXTAREA")) {
      node.addEventListener("input", (function () {
        var attrVal = node.getAttribute("v-model");
        _this._binding[attrVal]._directives.push(new Watcher("input", node, _this, attrVal, "value"));
        return function () {
          _this.$data[attrVal] = node.value;
        }
      })());
    }
    if (node.hasAttribute("v-bind")) {
      var attrVal = node.getAttribute("v-bind");
      _this._binding[attrVal]._directives.push(new Watcher("text", node, _this, attrVal, "innerHTML"));
    }
  }
}

/**
 * 订阅者类，绑定函数，更新DOM，实现Model -> View 的绑定
 * @param {String} name 
 * @param {*} el DOM元素
 * @param {Object} vm vue实例对象
 * @param {String} exp 实例属性
 * @param {String} attr DOM元素属性
 */
function Watcher(name, el, vm, exp, attr) {
  this.name = name;
  this.el = el;
  this.vm = vm;
  this.exp = exp;
  this.attr = attr;

  this.update();
}

Watcher.prototype.update = function () {
  this.el[this.attr] = this.vm.$data[this.exp];
}