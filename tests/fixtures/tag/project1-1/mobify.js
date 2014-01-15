


    
/* Ark saves scripts before the flood (document.open) and can restore them after.
 */
(function(Mobify) {

var contraband = {}

  , index = 0

  , nextId = function() {
        return "_generatedID_" + index++;
    }

    // `document.open` wipes objects in all browsers but WebKit.
  , documentOpenWipesObjects = !navigator.userAgent.match(/webkit/i)
  , _store = function(name, fn) {
        var bucket = contraband[name] = contraband[name] || [];
        bucket.push(fn);
    }

  , ark = Mobify.ark = {
        // Store a script in the ark.
        // `name`: Storage key.
        // `fn`: What to store.
        // `passive`: Whether `fn` should be executed now or not.
        store: function(name, fn, passive) {
            if (typeof name == 'function') {
                passive = fn;
                fn = name;
                name = nextId();
            }
            
            if (!passive && fn.call) {
                if (documentOpenWipesObjects) {
                    _store(name, fn);
                }
                fn();
            } else {
                _store(name, fn);
            }

        }

        // Returns the HTML to restore a script from the ark.
      , load: function(sNames) {
            var result = [];
            if (sNames) {
                var aNames = sNames.split(/[ ,]/);
                for (var i = 0, l = aNames.length; i < l; ++i) {
                    var bucket = contraband[aNames[i]];
                    if (!bucket) continue;

                    for (var j = 0, bl = bucket.length; j < bl; ++j) {
                        var fn = bucket[j];
                        if (fn.call) fn = '(' + fn + ')()';
                        result.push('<script>' + fn + '</script>');                        
                    }
                }
            } else {
                for (var key in contraband) {
                    result.push(Mobify.ark.load(key));
                }
            }
            return result.join('\n');
        }

        // Dust helper to restore scripts from the ark.
      , dustSection: function(chunk, context, bodies, params) {
            var output = ark.load(params && params.name);
            return chunk.write(output);
        }
    };

})(Mobify);

Mobify.ark.store("jquery",function(){
    window.Mobify = window.Mobify || {};
    
        //     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function(undefined){
  if (String.prototype.trim === undefined) // fix for iOS 3.2
    String.prototype.trim = function(){ return this.replace(/^\s+/, '').replace(/\s+$/, '') }

  // For iOS 3.x
  // from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
  if (Array.prototype.reduce === undefined)
    Array.prototype.reduce = function(fun){
      if(this === void 0 || this === null) throw new TypeError()
      var t = Object(this), len = t.length >>> 0, k = 0, accumulator
      if(typeof fun != 'function') throw new TypeError()
      if(len == 0 && arguments.length == 1) throw new TypeError()

      if(arguments.length >= 2)
       accumulator = arguments[1]
      else
        do{
          if(k in t){
            accumulator = t[k++]
            break
          }
          if(++k >= len) throw new TypeError()
        } while (true)

      while (k < len){
        if(k in t) accumulator = fun.call(undefined, accumulator, t[k], k, t)
        k++
      }
      return accumulator
    }

})()

        //     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice, filter = emptyArray.filter,
    document = window.document,
    elementDisplay = {}, classCache = {},
    getComputedStyle = document.defaultView.getComputedStyle,
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,

    // Used by `$.zepto.init` to wrap elements, text/comment nodes, document,
    // and document fragment node types.
    elementTypes = [1, 3, 8, 9, 11],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    classSelectorRE = /^\.([\w-]+)$/,
    idSelectorRE = /^#([\w-]+)$/,
    tagSelectorRE = /^[\w-]+$/,
    toString = {}.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div')

  zepto.matches = function(element, selector) {
    if (!element || element.nodeType !== 1) return false
    var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                          element.oMatchesSelector || element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function isFunction(value) { return toString.call(value) == "[object Function]" }
  function isObject(value) { return value instanceof Object }
  function isPlainObject(value) {
    return isObject(value) && value.__proto__ == Object.prototype
  }
  function isArray(value) { return value instanceof Array }
  function likeArray(obj) { return typeof obj.length == 'number' }

  function compact(array) { return filter.call(array, function(item){ return item !== undefined && item !== null }) }
  function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overriden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function(html, name) {
    if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
    if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
    if (!(name in containers)) name = '*'

    var container = containers[name]
    container.innerHTML = '' + html
    return $.each(slice.call(container.childNodes), function(){
      container.removeChild(this)
    })
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. Note that `__proto__` is not supported on Internet
  // Explorer. This method can be overriden in plugins.
  zepto.Z = function(dom, selector) {
    dom = dom || []
    dom.__proto__ = arguments.callee.prototype
    dom.selector = selector || ''
    return dom
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overriden in plugins.
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overriden in plugins.
  zepto.init = function(selector, context) {
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, juts return it
    else if (zepto.isZ(selector)) return selector
    else {
      var dom
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // if a JavaScript object is given, return a copy of it
      // this is a somewhat peculiar option, but supported by
      // jQuery so we'll do it, too
      else if (isPlainObject(selector))
        dom = [$.extend({}, selector)], selector = null
      // wrap stuff like `document` or `window`
      else if (elementTypes.indexOf(selector.nodeType) >= 0 || selector === window)
        dom = [selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
      // create a new Zepto collection from the nodes found
      return zepto.Z(dom, selector)
    }
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, whichs makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    slice.call(arguments, 1).forEach(function(source) {
      for (key in source)
        if (source[key] !== undefined)
          target[key] = source[key]
    })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overriden in plugins.
  zepto.qsa = function(element, selector){
    var found
    return (element === document && idSelectorRE.test(selector)) ?
      ( (found = element.getElementById(RegExp.$1)) ? [found] : emptyArray ) :
      (element.nodeType !== 1 && element.nodeType !== 9) ? emptyArray :
      slice.call(
        classSelectorRE.test(selector) ? element.getElementsByClassName(RegExp.$1) :
        tagSelectorRE.test(selector) ? element.getElementsByTagName(selector) :
        element.querySelectorAll(selector)
      )
  }

  function filtered(nodes, selector) {
    return selector === undefined ? $(nodes) : $(nodes).filter(selector)
  }

  function funcArg(context, arg, idx, payload) {
   return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  $.isFunction = isFunction
  $.isObject = isObject
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.trim = function(str) { return str.trim() }

  // plugin compatibility
  $.uuid = 0

  $.map = function(elements, callback){
    var value, values = [], i, key
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  $.each = function(elements, callback){
    var i, key
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    indexOf: emptyArray.indexOf,
    concat: emptyArray.concat,

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function(fn){
      return $.map(this, function(el, i){ return fn.call(el, i, el) })
    },
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    ready: function(callback){
      if (readyRE.test(document.readyState)) callback($)
      else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
      return this
    },
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx]
    },
    toArray: function(){ return this.get() },
    size: function(){
      return this.length
    },
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
    each: function(callback){
      this.forEach(function(el, idx){ callback.call(el, idx, el) })
      return this
    },
    filter: function(selector){
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },
    not: function(selector){
      var nodes=[]
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector){
      var result
      if (this.length == 1) result = zepto.qsa(this[0], selector)
      else result = this.map(function(){ return zepto.qsa(this, selector) })
      return $(result)
    },
    closest: function(selector, context){
      var node = this[0]
      while (node && !zepto.matches(node, selector))
        node = node !== context && node !== document && node.parentNode
      return $(node)
    },
    parents: function(selector){
      var ancestors = [], nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && node !== document && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function(selector){
      return filtered(this.map(function(){ return slice.call(this.children) }), selector)
    },
    contents: function() {
      return $(this.map(function() { return slice.call(this.childNodes) }))
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return filter.call(slice.call(el.parentNode.children), function(child){ return child!==el })
      }), selector)
    },
    empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function(property){
      return this.map(function(){ return this[property] })
    },
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = null)
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    wrap: function(newContent){
      return this.each(function(){
        $(this).wrapAll($(newContent)[0].cloneNode(false))
      })
    },
    wrapAll: function(newContent){
      if (this[0]) {
        $(this[0]).before(newContent = $(newContent))
        newContent.append(this)
      }
      return this
    },
    wrapInner: function(newContent){
      return this.each(function(){
        var self = $(this), contents = self.contents()
        contents.length ? contents.wrapAll(newContent) : self.append(newContent)
      })
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function(){
      return $(this.map(function(){ return this.cloneNode(true) }))
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return +!!(setting === undefined ? this.css("display") == "none" : setting) ? this.show() : this.hide()
    },
    prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
    next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
    html: function(html){
      return html === undefined ?
        (this.length > 0 ? this[0].innerHTML : null) :
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        })
    },
    text: function(text){
      return text === undefined ?
        (this.length > 0 ? this[0].textContent : null) :
        this.each(function(){ this.textContent = text })
    },
    attr: function(name, value){
      var result
      return (typeof name == 'string' && value === undefined) ?
        (this.length == 0 || this[0].nodeType !== 1 ? undefined :
          (name == 'value' && this[0].nodeName == 'INPUT') ? this.val() :
          (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        ) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) this.setAttribute(key, name[key])
          else this.setAttribute(name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
    removeAttr: function(name){
      return this.each(function(){ if (this.nodeType === 1) this.removeAttribute(name) })
    },
    prop: function(name, value){
      return (value === undefined) ?
        (this[0] ? this[0][name] : undefined) :
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name])
        })
    },
    data: function(name, value){
      var data = this.attr('data-' + dasherize(name), value)
      return data !== null ? data : undefined
    },
    val: function(value){
      return (value === undefined) ?
        (this.length > 0 ?
          (this[0].multiple ? $(this[0]).find('option').filter(function(o){ return this.selected }).pluck('value') : this[0].value) :
          undefined) :
        this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        })
    },
    offset: function(){
      if (this.length==0) return null
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: obj.width,
        height: obj.height
      }
    },
    css: function(property, value){
      if (value === undefined && typeof property == 'string')
        return (
          this.length == 0
            ? undefined
            : this[0].style[camelize(property)] || getComputedStyle(this[0], '').getPropertyValue(property))

      var css = ''
      for (key in property)
        if(typeof property[key] == 'string' && property[key] == '')
          this.each(function(){ this.style.removeProperty(dasherize(key)) })
        else
          css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'

      if (typeof property == 'string')
        if (value == '')
          this.each(function(){ this.style.removeProperty(dasherize(property)) })
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value)

      return this.each(function(){ this.style.cssText += ';' + css })
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name){
      if (this.length < 1) return false
      else return classRE(name).test(this[0].className)
    },
    addClass: function(name){
      return this.each(function(idx){
        classList = []
        var cls = this.className, newName = funcArg(this, name, idx, cls)
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        classList.length && (this.className += (cls ? " " : "") + classList.join(" "))
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (name === undefined)
          return this.className = ''
        classList = this.className
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ")
        })
        this.className = classList.trim()
      })
    },
    toggleClass: function(name, when){
      return this.each(function(idx){
        var newName = funcArg(this, name, idx, this.className)
        ;+!!(when === undefined ? !$(this).hasClass(newName) : when) ?
          $(this).addClass(newName) : $(this).removeClass(newName)
      })
    }
  }

  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function(dimension){
    $.fn[dimension] = function(value){
      var offset, Dimension = dimension.replace(/./, function(m){ return m[0].toUpperCase() })
      if (value === undefined) return this[0] == window ? window['inner' + Dimension] :
        this[0] == document ? document.documentElement['offset' + Dimension] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        var el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function insert(operator, target, node) {
    var parent = (operator % 2) ? target : target.parentNode
    parent ? parent.insertBefore(node,
      !operator ? target.nextSibling :      // after
      operator == 1 ? parent.firstChild :   // prepend
      operator == 2 ? target :              // before
      null) :                               // append
      $(node).remove()
  }

  function traverseNode(node, fun) {
    fun(node)
    for (var key in node.childNodes) traverseNode(node.childNodes[key], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(key, operator) {
    $.fn[key] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var nodes = $.map(arguments, function(n){ return isObject(n) ? n : zepto.fragment(n) })
      if (nodes.length < 1) return this
      var size = this.length, copyByClone = size > 1, inReverse = operator < 2

      return this.each(function(index, target){
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes[inReverse ? nodes.length-i-1 : i]
          traverseNode(node, function(node){
            if (node.nodeName != null && node.nodeName.toUpperCase() === 'SCRIPT' && (!node.type || node.type === 'text/javascript'))
              window['eval'].call(window, node.innerHTML)
          })
          if (copyByClone && index < size - 1) node = node.cloneNode(true)
          insert(operator, target, node)
        }
      })
    }

    $.fn[(operator % 2) ? key+'To' : 'insert'+(operator ? 'Before' : 'After')] = function(html){
      $(html)[key](this)
      return this
    }
  })

  zepto.Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.camelize = camelize
  zepto.uniq = uniq
  $.zepto = zepto

  return $
})()

// If `$` is not yet defined, point it to `Zepto`
window.Zepto = Zepto
'$' in window || (window.$ = Zepto)

        //     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  function detect(ua){
    var os = this.os = {}, browser = this.browser = {},
      webkit = ua.match(/WebKit\/([\d.]+)/),
      android = ua.match(/(Android)\s+([\d.]+)/),
      ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
      webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
      touchpad = webos && ua.match(/TouchPad/),
      kindle = ua.match(/Kindle\/([\d.]+)/),
      silk = ua.match(/Silk\/([\d._]+)/),
      blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/)

    // todo clean this up with a better OS/browser
    // separation. we need to discern between multiple
    // browsers on android, and decide if kindle fire in
    // silk mode is android or not

    if (browser.webkit = !!webkit) browser.version = webkit[1]

    if (android) os.android = true, os.version = android[2]
    if (iphone) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.')
    if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.')
    if (webos) os.webos = true, os.version = webos[2]
    if (touchpad) os.touchpad = true
    if (blackberry) os.blackberry = true, os.version = blackberry[2]
    if (kindle) os.kindle = true, os.version = kindle[1]
    if (silk) browser.silk = true, browser.version = silk[1]
    if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true
  }

  detect.call($, navigator.userAgent)
  // make available to unit tests
  $.__detect = detect

})(Zepto)

        //     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var $$ = $.zepto.qsa, handlers = {}, _zid = 1, specialEvents={}

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eachEvent(events, fn, iterator){
    if ($.isObject(events)) $.each(events, iterator)
    else events.split(/\s/).forEach(function(type){ iterator(type, fn) })
  }

  function add(element, events, fn, selector, getDelegate, capture){
    capture = !!capture
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    eachEvent(events, fn, function(event, fn){
      var delegate = getDelegate && getDelegate(fn, event),
        callback = delegate || fn
      var proxyfn = function (event) {
        var result = callback.apply(element, [event].concat(event.data))
        if (result === false) event.preventDefault()
        return result
      }
      var handler = $.extend(parse(event), {fn: fn, proxy: proxyfn, sel: selector, del: delegate, i: set.length})
      set.push(handler)
      element.addEventListener(handler.e, proxyfn, capture)
    })
  }
  function remove(element, events, fn, selector){
    var id = zid(element)
    eachEvent(events || '', fn, function(event, fn){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
        element.removeEventListener(handler.e, handler.proxy, false)
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function(fn, context) {
    if ($.isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (typeof context == 'string') {
      return $.proxy(fn[context], fn)
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, callback){
    return this.each(function(){
      add(this, event, callback)
    })
  }
  $.fn.unbind = function(event, callback){
    return this.each(function(){
      remove(this, event, callback)
    })
  }
  $.fn.one = function(event, callback){
    return this.each(function(i, element){
      add(this, event, callback, null, function(fn, type){
        return function(){
          var result = fn.apply(element, arguments)
          remove(element, type, fn)
          return result
        }
      })
    })
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }
  function createProxy(event) {
    var proxy = $.extend({originalEvent: event}, event)
    $.each(eventMethods, function(name, predicate) {
      proxy[name] = function(){
        this[predicate] = returnTrue
        return event[name].apply(event, arguments)
      }
      proxy[predicate] = returnFalse
    })
    return proxy
  }

  // emulates the 'defaultPrevented' property for browsers that have none
  function fix(event) {
    if (!('defaultPrevented' in event)) {
      event.defaultPrevented = false
      var prevent = event.preventDefault
      event.preventDefault = function() {
        this.defaultPrevented = true
        prevent.call(this)
      }
    }
  }

  $.fn.delegate = function(selector, event, callback){
    var capture = false
    if(event == 'blur' || event == 'focus'){
      if($.iswebkit)
        event = event == 'blur' ? 'focusout' : event == 'focus' ? 'focusin' : event
      else
        capture = true
    }

    return this.each(function(i, element){
      add(element, event, callback, selector, function(fn){
        return function(e){
          var evt, match = $(e.target).closest(selector, element).get(0)
          if (match) {
            evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
            return fn.apply(match, [evt].concat([].slice.call(arguments, 1)))
          }
        }
      }, capture)
    })
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  $.fn.on = function(event, selector, callback){
    return selector == undefined || $.isFunction(selector) ?
      this.bind(event, selector || callback) : this.delegate(selector, event, callback)
  }
  $.fn.off = function(event, selector, callback){
    return selector == undefined || $.isFunction(selector) ?
      this.unbind(event, selector || callback) : this.undelegate(selector, event, callback)
  }

  $.fn.trigger = function(event, data){
    if (typeof event == 'string') event = $.Event(event)
    fix(event)
    event.data = data
    return this.each(function(){
      // items in the collection might not be DOM elements
      // (todo: possibly support events on plain old objects)
      if('dispatchEvent' in this) this.dispatchEvent(event)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, data){
    var e, result
    this.each(function(i, element){
      e = createProxy(typeof event == 'string' ? $.Event(event) : event)
      e.data = data
      e.target = element
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback){ return this.bind(event, callback) }
  })

  ;['focus', 'blur'].forEach(function(name) {
    $.fn[name] = function(callback) {
      if (callback) this.bind(name, callback)
      else if (this.length) try { this.get(0)[name]() } catch(e){}
      return this
    }
  })

  $.Event = function(type, props) {
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true, null, null, null, null, null, null, null, null, null, null, null, null)
    return event
  }

})(Zepto)

        //     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($, undefined){
  var prefix = '', eventPrefix, endEventName, endAnimationName,
    vendors = { Webkit: 'webkit', Moz: '', O: 'o', ms: 'MS' },
    document = window.document, testEl = document.createElement('div'),
    supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    clearProperties = {}

  function downcase(str) { return str.toLowerCase() }
  function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : downcase(name) }

  $.each(vendors, function(vendor, event){
    if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
      prefix = '-' + downcase(vendor) + '-'
      eventPrefix = event
      return false
    }
  })

  clearProperties[prefix + 'transition-property'] =
  clearProperties[prefix + 'transition-duration'] =
  clearProperties[prefix + 'transition-timing-function'] =
  clearProperties[prefix + 'animation-name'] =
  clearProperties[prefix + 'animation-duration'] = ''

  $.fx = {
    off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
    cssPrefix: prefix,
    transitionEnd: normalizeEvent('TransitionEnd'),
    animationEnd: normalizeEvent('AnimationEnd')
  }

  $.fn.animate = function(properties, duration, ease, callback){
    if ($.isObject(duration))
      ease = duration.easing, callback = duration.complete, duration = duration.duration
    if (duration) duration = duration / 1000
    return this.anim(properties, duration, ease, callback)
  }

  $.fn.anim = function(properties, duration, ease, callback){
    var transforms, cssProperties = {}, key, that = this, wrappedCallback, endEvent = $.fx.transitionEnd
    if (duration === undefined) duration = 0.4
    if ($.fx.off) duration = 0

    if (typeof properties == 'string') {
      // keyframe animation
      cssProperties[prefix + 'animation-name'] = properties
      cssProperties[prefix + 'animation-duration'] = duration + 's'
      endEvent = $.fx.animationEnd
    } else {
      // CSS transitions
      for (key in properties)
        if (supportedTransforms.test(key)) {
          transforms || (transforms = [])
          transforms.push(key + '(' + properties[key] + ')')
        }
        else cssProperties[key] = properties[key]

      if (transforms) cssProperties[prefix + 'transform'] = transforms.join(' ')
      if (!$.fx.off && typeof properties === 'object') {
        cssProperties[prefix + 'transition-property'] = Object.keys(properties).join(', ')
        cssProperties[prefix + 'transition-duration'] = duration + 's'
        cssProperties[prefix + 'transition-timing-function'] = (ease || 'linear')
      }
    }

    wrappedCallback = function(event){
      if (typeof event !== 'undefined') {
        if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
        $(event.target).unbind(endEvent, arguments.callee)
      }
      $(this).css(clearProperties)
      callback && callback.call(this)
    }
    if (duration > 0) this.bind(endEvent, wrappedCallback)

    setTimeout(function() {
      that.css(cssProperties)
      if (duration <= 0) setTimeout(function() {
        that.each(function(){ wrappedCallback.call(this) })
      }, 0)
    }, 0)

    return this
  }

  testEl = null
})(Zepto)

        //     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var jsonpID = 0,
      isObject = $.isObject,
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.defaultPrevented
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  function ajaxSuccess(data, xhr, settings) {
    var context = settings.context, status = 'success'
    settings.success.call(context, data, status, xhr)
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error])
    ajaxComplete(type, xhr, settings)
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    settings.complete.call(context, xhr, status)
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    ajaxStop(settings)
  }

  // Empty function, used as default callback
  function empty() {}

  $.ajaxJSONP = function(options){
    var callbackName = 'jsonp' + (++jsonpID),
      script = document.createElement('script'),
      abort = function(){
        $(script).remove()
        if (callbackName in window) window[callbackName] = empty
        ajaxComplete('abort', xhr, options)
      },
      xhr = { abort: abort }, abortTimeout

    if (options.error) script.onerror = function() {
      xhr.abort()
      options.error()
    }

    window[callbackName] = function(data){
      clearTimeout(abortTimeout)
      $(script).remove()
      delete window[callbackName]
      ajaxSuccess(data, xhr, options)
    }

    serializeData(options)
    script.src = options.url.replace(/=\?/, '=' + callbackName)
    $('head').append(script)

    if (options.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.abort()
        ajaxComplete('timeout', xhr, options)
      }, options.timeout)

    return xhr
  }

  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    accepts: {
      script: 'text/javascript, application/javascript',
      json:   jsonType,
      xml:    'application/xml, text/xml',
      html:   htmlType,
      text:   'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0
  }

  function mimeToDataType(mime) {
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }

  function appendQuery(url, query) {
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (isObject(options.data)) options.data = $.param(options.data)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
      options.url = appendQuery(options.url, options.data)
  }

  $.ajax = function(options){
    var settings = $.extend({}, options || {})
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    ajaxStart(settings)

    if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
      RegExp.$2 != window.location.host

    var dataType = settings.dataType, hasPlaceholder = /=\?/.test(settings.url)
    if (dataType == 'jsonp' || hasPlaceholder) {
      if (!hasPlaceholder) settings.url = appendQuery(settings.url, 'callback=?')
      return $.ajaxJSONP(settings)
    }

    if (!settings.url) settings.url = window.location.toString()
    serializeData(settings)

    var mime = settings.accepts[dataType],
        baseHeaders = { },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = $.ajaxSettings.xhr(), abortTimeout

    if (!settings.crossDomain) baseHeaders['X-Requested-With'] = 'XMLHttpRequest'
    if (mime) {
      baseHeaders['Accept'] = mime
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    if (settings.contentType || (settings.data && settings.type.toUpperCase() != 'GET'))
      baseHeaders['Content-Type'] = (settings.contentType || 'application/x-www-form-urlencoded')
    settings.headers = $.extend(baseHeaders, settings.headers || {})

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        clearTimeout(abortTimeout)
        var result, error = false
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'))
          result = xhr.responseText

          try {
            if (dataType == 'script')    (1,eval)(result)
            else if (dataType == 'xml')  result = xhr.responseXML
            else if (dataType == 'json') result = blankRE.test(result) ? null : JSON.parse(result)
          } catch (e) { error = e }

          if (error) ajaxError(error, 'parsererror', xhr, settings)
          else ajaxSuccess(result, xhr, settings)
        } else {
          ajaxError(null, 'error', xhr, settings)
        }
      }
    }

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async)

    for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name])

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      return false
    }

    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings)
      }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  $.get = function(url, success){ return $.ajax({ url: url, success: success }) }

  $.post = function(url, data, success, dataType){
    if ($.isFunction(data)) dataType = dataType || success, success = data, data = null
    return $.ajax({ type: 'POST', url: url, data: data, success: success, dataType: dataType })
  }

  $.getJSON = function(url, success){
    return $.ajax({ url: url, success: success, dataType: 'json' })
  }

  $.fn.load = function(url, success){
    if (!this.length) return this
    var self = this, parts = url.split(/\s/), selector
    if (parts.length > 1) url = parts[0], selector = parts[1]
    $.get(url, function(response){
      self.html(selector ?
        $(document.createElement('div')).html(response.replace(rscript, "")).find(selector).html()
        : response)
      success && success.call(self)
    })
    return this
  }

  var escape = encodeURIComponent

  function serialize(params, obj, traditional, scope){
    var array = $.isArray(obj)
    $.each(obj, function(key, value) {
      if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']'
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value)
      // recurse into nested objects
      else if (traditional ? $.isArray(value) : isObject(value))
        serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }

  $.param = function(obj, traditional){
    var params = []
    params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) }
    serialize(params, obj, traditional)
    return params.join('&').replace('%20', '+')
  }
})(Zepto)

        //     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function ($) {
  $.fn.serializeArray = function () {
    var result = [], el
    $( Array.prototype.slice.call(this.get(0).elements) ).each(function () {
      el = $(this)
      var type = el.attr('type')
      if (this.nodeName.toLowerCase() != 'fieldset' &&
        !this.disabled && type != 'submit' && type != 'reset' && type != 'button' &&
        ((type != 'radio' && type != 'checkbox') || this.checked))
        result.push({
          name: el.attr('name'),
          value: el.val()
        })
    })
    return result
  }

  $.fn.serialize = function () {
    var result = []
    this.serializeArray().forEach(function (elm) {
      result.push( encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value) )
    })
    return result.join('&')
  }

  $.fn.submit = function (callback) {
    if (callback) this.bind('submit', callback)
    else if (this.length) {
      var event = $.Event('submit')
      this.eq(0).trigger(event)
      if (!event.defaultPrevented) this.get(0).submit()
    }
    return this
  }

})(Zepto)

        ;(function($){
  var zepto = $.zepto, oldQsa = zepto.qsa, oldMatches = zepto.matches

  function visible(elem){
    elem = $(elem)
    return !!(elem.width() || elem.height()) && elem.css("display") !== "none"
  }

  // Implements a subset from:
  // http://api.jquery.com/category/selectors/jquery-selector-extensions/
  //
  // Each filter function receives the current index, all nodes in the
  // considered set, and a value if there were parentheses. The value
  // of `this` is the node currently being considered. The function returns the
  // resulting node(s), null, or undefined.
  //
  // Complex selectors are not supported:
  //   li:has(label:contains("foo")) + li:has(label:contains("bar"))
  //   "> h2"
  //   ul.inner:first > li
  var filters = zepto.cssFilters = {
    visible:  function(){ if (visible(this)) return this },
    hidden:   function(){ if (!visible(this)) return this },
    selected: function(){ if (this.selected) return this },
    checked:  function(){ if (this.checked) return this },
    parent:   function(){ return this.parentNode },
    first:    function(idx){ if (idx === 0) return this },
    last:     function(idx, nodes){ if (idx === nodes.length - 1) return this },
    eq:       function(idx, _, value){ if (idx === value) return this },
    contains: function(idx, _, text){ if ($(this).text().indexOf(text) > -1) return this },
    has:      function(idx, _, sel){ if (zepto.qsa(this, sel).length) return this }
  }

  var re = new RegExp('(.*):(\\w+)(?:\\(([^)]+)\\))?$\\s*')

  function process(sel, fn) {
    var filter, arg, match = sel.match(re)
    if (match && match[2] in filters) {
      var filter = filters[match[2]], arg = match[3]
      sel = match[1]
      if (arg) {
        var num = Number(arg)
        if (isNaN(num)) arg = arg.replace(/^["']|["']$/g, '')
        else arg = num
      }
    }
    return fn(sel, filter, arg)
  }

  zepto.qsa = function(node, selector) {
    return process(selector, function(sel, filter, arg){
      try {
        if (!sel && filter) sel = '*'
        var nodes = oldQsa(node, sel)
      } catch(e) {
        console.error('error performing selector: %o', selector)
        throw e
      }
      return !filter ? nodes :
        zepto.uniq($.map(nodes, function(n, i){ return filter.call(n, i, nodes, arg) }))
    })
  }

  zepto.matches = function(node, selector){
    return process(selector, function(sel, filter, arg){
      return (!sel || oldMatches(node, sel)) &&
        (!filter || filter.call(node, null, arg) === node)
    })
  }
})(Zepto)

        //     Zepto.js
//     (c) 2010-2012 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  $.fn.end = function(){
    return this.prevObject || $()
  }

  $.fn.andSelf = function(){
    return this.add(this.prevObject || $())
  }

  'filter,add,not,eq,first,last,find,closest,parents,parent,children,siblings'.split(',').forEach(function(property){
    var fn = $.fn[property]
    $.fn[property] = function(){
      var ret = fn.apply(this, arguments)
      ret.prevObject = this
      return ret
    }
  })
})(Zepto)

    
    if ($.noConflict) {
	Mobify.$ = $.noConflict(true)
} else {
	Mobify.$ = window.Zepto;
	Mobify.$.support = Mobify.$.support || {};
	if (Zepto === $) delete window.$;
	delete window.Zepto;
}
},false);

Mobify.ark.store("lib","(function(e,t,n,r){function m(t,r){function S(e,t){var n=b+e*-1;x(n,t)}function x(e,t){e<0&&(e=0),e>=y&&(e=y-1);if(t||e!=b){if(!t){l.trigger(\"indexchange\",[e,b]);if(c.focus){var r=n(c.focus).offset();r&&n(\"body\").animate({scrollTop:r.top},250)}var i=g.slice(0,e+1+c.lazyLookahead).find(\"img[lazysrc]\");i.each(function(e,t){this.setAttribute(\"src\",this.getAttribute(\"lazysrc\")),this.removeAttribute(\"lazysrc\")})}b=e;var s=g.eq(b),o=g.eq(0),u=s.offset().left,a=o.offset().left,f=s.width(),p=o.width(),v=parseInt(o.parent().css(\"marginLeft\"))||0;w=-(u-a-(f-p)*(v/p))}h[d]=c.duration,E()}function O(e){s.touch||e.preventDefault(),T=!0,N=!1,C=o(e),k=0,L=0,A=!1,h[d]=\"0s\"}function M(e){if(!T||N)return;var t=o(e);k=C.x-t.x,L=C.y-t.y;if(A||i(k)>i(L)&&i(k)>c.minDragDelta){A=!0,e.preventDefault();if(b==0&&k<0||b==y-1&&k>0)k*=.4;E(w-k)}else i(L)>i(k)&&i(L)>c.minDragDelta&&(N=!0)}function _(e){T=!1;var t=i(k),n=0;t>i(L)&&t>c.minMoveDelta&&(n=t>g.eq(b).width()?2:1,n*=k>0?-1:1),S(n)}function D(e){A&&e.preventDefault()}function P(){T&&_()}function H(){setTimeout(function(){S(0,!0)},1)}var l=n(t);if(l.data(\"slide\"))return;l.data(\"slide\",!0);var c=n.extend({},m.defaults,r),h=l[0].style,g=l.children(),y=g.length,b=0,w=0,E=v?function(e){t.style[p]=a+(e||w)+f}:function(e){h.left=(e||w)+\"px\"};E();var T=!1,N=!1,C,k,L,A;n(e).bind(\"orientationchange.slide\",H),l.bind(u.down+\".slide\",O).bind(u.move+\".slide\",M).bind(u.up+\".slide\",_).bind(\"click.slide\",D).bind(\"slidemove.slide\",function(e,t){S(t)}).bind(\"indexchange.slide\",function(e,t,r){n(c.dots).children().removeClass(c.dotsClass).eq(t).addClass(c.dotsClass)}).trigger(\"indexchange\",[b,b]),s.touch||l.bind(\"mouseout.slide\",P),y<=c.maxDots&&n(c.dots).addClass(\"on\").children().bind(\"touchstart.slide mouseup.slide\",function(e){e.type==\"touchstart\"&&e.preventDefault(),x(n(this).index())})}function g(t,r){var i=n.extend({},m.defaults,r),s=n(t);s.unbind(\".slide\").data(\"slide\",!1),n(e).unbind(\".slide\"),n(i.dots).unbind(\".slide\")}n.extend(n.support,{touch:\"ontouchend\"in t,transitions3d:!!(e.WebKitCSSMatrix&&\"m11\"in new WebKitCSSMatrix)});var i=Math.abs,s=n.support,o=s.touch?function(e){return e=e.originalEvent||e,{x:e.touches[0].clientX,y:e.touches[0].clientY}}:function(e){return{x:e.clientX,y:e.clientY}},u=s.touch?{down:\"touchstart\",move:\"touchmove\",up:\"touchend\"}:{down:\"mousedown\",move:\"mousemove\",up:\"mouseup\"};n.support.events=u;var a=\"translate\"+(s.transitions3d?\"3d(\":\"(\"),f=s.transitions3d?\"px,0,0)\":\"px,0)\",l=[\"Webkit\",\"Moz\",\"O\",\"ms\",\"\"],c=t.createElement(\"div\").style,h=function(e){for(var t=0;t<l.length;++t)if(c[l[t]+e]!==r)return l[t]+e},p=h(\"Transform\"),d=h(\"TransitionDuration\"),v=!!p;m.defaults={minDragDelta:10,minMoveDelta:20,dots:\".x-slide-dots\",dotsClass:\"x-current\",maxDots:12,duration:\"0.5s\",lazyLookahead:1},n.fn.slide=function(e){return this.each(function(){m(this,e)})},n.fn.unslide=function(e){return this.each(function(){g(this,e)})},t.addEventListener(\"DOMContentLoaded\",function y(){t.removeEventListener(\"DOMContentLoaded\",y,!1),n(\".x-slide-items\").slide()},!1)})(window,document,Mobify.$)",true);

Mobify.ark.store("combo",function(){
    /**
 * httpCache: An implementation of an in memory HTTP cache that persists data to
 * localStorage.
 */
(function(window, Mobify) {
    /**
     * Retrieve `key` from the cache. Mark as used if `increment` is set.
     */
var get = function(key, increment) {
        // Ignore anchors.
        var resource = cache[key.split('#')[0]];

        if (resource && increment) {
            resource.lastUsed = Date.now();
            resource.useCount = resource.useCount++ || 1;
        }

        return resource;
    }

  , set = function(key, val) {
        cache[key] = val;
    }

    /**
     * Load the persistent cache into memory. Ignore stale resources.
     */
  , load = function() {
        var data = localStorage.getItem(localStorageKey)
          , key;

        if (data === null) {
            return;
        }

        try {
            data = JSON.parse(data)
        } catch(err) {
            return;
        }

        for (key in data) {
            if (data.hasOwnProperty(key) && !httpCache.utils.isStale(data[key])) {
                set(key, data[key]);
            }
        }
    }

    /**
     * Save the in-memory cache to localStorage. If the localStorage is full, 
     * use LRU to drop resources until it will fit on disk, or give up after 10 
     * attempts.
     */
  , save = function(callback) {
        var resources = {}
          , resource
          , attempts = 10
          , key;

        for (key in cache) {
            if (cache.hasOwnProperty(key)) {
                resources[key] = cache[key];
            }
        }

        (function persist() {
            setTimeout(function() {
                var serialized;
                // End of time.
                var lruTime = 9007199254740991;
                var lruKey;
                try {
                    serialized = JSON.stringify(resources);
                } catch(err) {
                    if (callback) callback(err);
                    return;
                }

                try {
                    localStorage.setItem(localStorageKey, serialized);
                } catch(err) {
                    if (!--attempts) {
                        if (callback) callback(err);
                        return;
                    }

                    for (key in resources) {
                        if (!resources.hasOwnProperty(key)) continue;
                        resource = resources[key];

                        // Nominate the LRU.
                        if (resource.lastUsed) {
                            if (resource.lastUsed <= lruTime) {
                                lruKey = key;
                                lruTime = resource.lastUsed;
                            }
                        // If a resource has not been used, it's the LRU.
                        } else {
                            lruKey = key;
                            lruTime = 0;
                            break;
                        }
                    }

                    delete resources[lruKey];
                    persist();
                    return;
                }

                if (callback) callback();

            }, 0);
        })();
    }

  , reset = function(val) {
        cache = val || {};
    }

  , localStorageKey = 'Mobify-Combo-Cache-v1.0'

    // In memory cache.
  , cache = {}

  , httpCache = Mobify.httpCache = {
        get: get
      , set: set
      , load: load
      , save: save
      , reset: reset
    };

})(this, Mobify);

/**
 * httpCache.utils: HTTP 1.1 Caching header helpers.
 */
(function(httpCache) {
   /**
    * Regular expressions for cache-control directives.
    * See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9
    */
var ccDirectives = /^\s*(public|private|no-cache|no-store)\s*$/
  , ccMaxAge = /^\s*(max-age)\s*=\s*(\d+)\s*$/

    /**
     * Returns an object representing a parsed HTTP 1.1 Cache-Control directive.
     * The object may contain the following relevant cache-control properties:
     * - public
     * - private
     * - no-cache
     * - no-store
     * - max-age
     */
  , ccParse = function (directives) {
        var obj = {}
          , match;

        directives.split(',').forEach(function(directive) {
            if (match = ccDirectives.exec(directive)) {
                obj[match[1]] = true
            } else if (match = ccMaxAge.exec(directive)) {
                obj[match[1]] = parseInt(match[2])
            }
        });

        return obj;
    }

  , utils = httpCache.utils = {
        /**
         * Returns a data URI for `resource` suitable for executing the script.
         */
        dataURI: function(resource) {
            var contentType = resource.headers['content-type'] || 'application/x-javascript'
            return 'data:' + contentType + (!resource.text
                 ? (';base64,' + resource.body)
                 : (',' + encodeURIComponent(resource.body)));
        }

        /**
         * Returns `true` if `resource` is stale by HTTP/1.1 caching rules.
         * Treats invalid headers as stale.
         */
      , isStale: function(resource) {
            var ONE_DAY_IN_MS = 24 * 60 * 60 * 1000
              , headers = resource.headers || {}
              , cacheControl = headers['cache-control']
              , now = Date.now()
              , date = Date.parse(headers.date)
              , lastModified = headers['last-modified']
              , modifiedAge
              , age
              , expires;

            // Fresh if less than 10 minutes old
            if (date && (now < date + 600 * 1000)) {
               return false;
            }

            // If `max-age` and `date` are present, and no other cache
            // directives exist, then we are stale if we are older.
            if (cacheControl && date) {
                cacheControl = ccParse(cacheControl);

                if ((cacheControl['max-age']) &&
                    (!cacheControl['no-store']) &&
                    (!cacheControl['no-cache'])) {
                    // Convert the max-age directive to ms.
                    return now > (date + (cacheControl['max-age'] * 1000));
                } else {
                    // there was no max-age or this was marked no-store or 
                    // no-cache, and so is stale
                    return true;
                }
            }

            // If `expires` is present, we are stale if we are older.
            if (headers.expires && (expires = Date.parse(headers.expires))) {
                return now > expires;
            }

            // Fresh if less than 10% of difference between date and 
            // last-modified old, up to a day
            if (lastModified && (lastModified = Date.parse(lastModified)) &&
              date) {
                modifiedAge = date - lastModified;
                age = now - date;
                // If the age is less than 10% of the time between the last 
                // modification and the response, and the age is less than a 
                // day, then it is not stale
                if ((age < 0.1 * modifiedAge) && (age < ONE_DAY_IN_MS)) {
                    return false;
                }
            }

            // Otherwise, we are stale.
            return true;
        }
    };

})(Mobify.httpCache);


/**
 * combineScripts: Clientside API to the combo service.
 */
(function(window, document, Mobify) {

var $ = Mobify.$

  , httpCache = Mobify.httpCache

  , absolutify = document.createElement('a')

  , combineScripts = function($els, opts) {
        var $scripts = $els.filter(defaults.selector).add($els.find(defaults.selector)).remove()
          , uncached = []
          , combo = false
          , bootstrap
          , url;

        // Fastfail if there are no scripts or if required modules are missing.
        if (!$scripts.length || !window.localStorage || !window.JSON) {
            return $scripts;
        }
        opts = opts || {};

        httpCache.load();

        $scripts.filter('[' + defaults.attribute + ']').each(function() {
            combo = true
            absolutify.href = this.getAttribute(defaults.attribute);
            url = absolutify.href;

            if (!httpCache.get(url)) {
                uncached.push(url);
            }

            this.removeAttribute(defaults.attribute);
            this.className += ' x-combo';
            this.innerHTML = defaults.execCallback + "('" + url + "', "
                + (!!opts.forceDataURI) + ");";
        });

        if (!combo) {
            return $scripts;
        }

        bootstrap = document.createElement('script')

        if (uncached.length) {
            bootstrap.src = getURL(uncached, defaults.loadCallback);
        } else {
            bootstrap.innerHTML = defaults.loadCallback + '();';
        }

        $scripts = $(bootstrap).add($scripts);
        return $scripts;
    }

  , defaults = combineScripts.defaults = {
        selector: 'script'
      , attribute: 'x-src'
      , proto: '//'
      , host: 'jazzcat.mobify.com'
      , endpoint: 'jsonp'
      , execCallback: 'Mobify.combo.exec'
      , loadCallback: 'Mobify.combo.load'
      , projectName: (Mobify && Mobify.config && Mobify.config.projectName) || ''
    }

  , combo = Mobify.combo = {
        // a copy of document.write in case it is reassigned by other scripts
        _docWrite: document.write,
        /**
         * Emit a <script> tag to execute the contents of `url` using
         * `document.write`. Prefer loading contents from cache.
         */
        exec: function(url, useDataURI) {
            var resource = httpCache.get(url, true),
                out;

            if (!resource) {
                out = 'src="' + url + '">';
            } else {
                out = 'data-orig-src="' + url + '"';

                if (useDataURI) {
                    out += ' src="' + httpCache.utils.dataURI(resource) + '">';
                } else {
                    // Explanation below uses [] to stand for <>.
                    // Inline scripts appear to work faster than data URIs on many OSes
                    // (e.g. Android 2.3.x, iOS 5, likely most of early 2013 device market)
                    //
                    // However, it is not safe to directly convert a remote script into an
                    // inline one. If there is a closing script tag inside the script,
                    // the script element will be closed prematurely.
                    //
                    // To guard against this, we need to prevent script element spillage.
                    // This is done by replacing [/script] with [/scr\ipt] inside script
                    // content. This transformation renders closing [/script] inert.
                    //
                    // The transformation is safe. There are three ways for a valid JS file
                    // to end up with a [/script] character sequence:
                    // * Inside a comment - safe to alter
                    // * Inside a string - replacing 'i' with '\i' changes nothing, as
                    //   backslash in front of characters that need no escaping is ignored.
                    // * Inside a regular expression starting with '/script' - '\i' has no
                    //   meaning inside regular expressions, either, so it is treated just
                    //   like 'i' when expression is matched.
                    //
                    // Talk to Roman if you want to know more about this.
                    out += '>' + resource.body.replace(/(<\/scr)(ipt\s*>)/ig, '$1\\$2');
                }
            }

            Mobify.combo._docWrite.call(document, '<script ' + out + '<\/script>');
        }

        /**
         * Callback for loading the httpCache and storing the results of a combo
         * query.
         */
      , load: function(resources) {
            var resource, i, save = false, now;
            now = Date.now();

            httpCache.load()

            if (!resources) return;

            for (i = 0; i < resources.length; i++) {
                resource = resources[i];
               if (resource.status == 'ready') {
                    resource.loadedTime = now;
                    save = true;
                    httpCache.set(encodeURI(resource.url), resource)
                }
            }

            if (save) httpCache.save();
        }
    }

    /**
     * Returns a URL suitable for use with the combo service. Sorted to generate
     * consistent URLs.
     */
  , getURL = Mobify.combo.getURL = function(urls, callback) {
        var projectName = defaults.projectName || '';
        return defaults.proto + defaults.host + 
          (projectName ? '/project-' + projectName : '') + 
          '/' + defaults.endpoint + '/' + callback + '/' +
          JSONURIencode(urls.slice().sort());
    }

  , JSONURIencode = Mobify.JSONURIencode = function(obj) {
        return encodeURIComponent(JSON.stringify(obj));
    };

$.fn.combineScripts = function(opts) {
    return combineScripts.call(window, this, opts)
}

// expose defaults for testing
$.fn.combineScripts.defaults = combineScripts.defaults;

Mobify.cssURL = function(obj) {
    return '//jazzcat.mobify.com/css/' + JSONURIencode(obj)
}

})(this, document, Mobify);
},false);

Mobify.ark.store("util",function(){
    (function($, Mobify) {

// Set optout cookie and reload to goto desktop.
// V6.X: mobify-path=
//
// `url`: Optional url to redirect to after opting out.
Mobify.desktop = function(url) {
    document.cookie = 'mobify-path=; path=/;';

    if (url) {
        location = url;
    } else {
        location.reload();
    }
};

// i18n function converts in a list of language types and data and returns
// a function that allows you to grab translation keys from that data
Mobify.i18n = function(list, data) {
    list.push("DEFAULT");

    var i18nlookup = function(key) {
        for(var i = 0; i < list.length; i++) {
            var value = data[list[i]][key];
            if (value) return value;
       }
    }
    return i18nlookup;
};

})(Mobify.$, Mobify);

},false);

(function() {
    // V6 tags don't set cookies/storage themselves, so we set them here.
    // https://github.com/mobify/portal_app/issues/186
    //
    // mobify-path=<mobifyjs-path>
    // mobify-all

    var hash = location.hash;
    var match = /mobify-path=([^&;]+)/g.exec(hash);
    if (match) {
        var path = match[1];
        if (/mobify-all/.test(hash)) {
            document.cookie = 'mobify-path=' + path + '; path=/';
        } else {
            document.cookie = 'mobify-path=1; path=/';
            sessionStorage["mobify-path"] = path;
        }
    }
})();
(function(Mobify, $) { 
    var console = Mobify.console = window.console;
    if (!console.group) {
        console.group = console.log;
        console.groupEnd = function(){};
    }
    $.extend(console, {
        die : function() {
            var args = [].slice.call(arguments);
            console.group('(T_T) Fatal error (T_T)')
            console.error.apply(console, args);
            console.groupEnd();

            if (!Mobify.config.isDebug) {
                Mobify.unmobify();
            }

            throw args;
        },
        logGroup : function(fn, title, obj) {
            var noneWritten = true;

            if (obj) {
                $.each(obj, function(key, value) {
                    noneWritten && console.group(title);
                    
                    if (typeof key == "number") {
                        console[fn].apply(window, value);
                    } else if (value instanceof Error) {
                        console.error(key, value.toString());
                    } else {
                        console[fn](key, value);
                    }
                    
                    noneWritten = false;
                });
            }

            noneWritten || console.groupEnd();
        }
    });
})(Mobify, Mobify.$);
/*! 
 * mobify.js
 * http://www.mobify.com/
 *
 * Copyright (c) Mobify R&D Inc.
 * Full license available at http://portal.mobify.com/license/
 */
(function ($, Mobify) {
    var console = Mobify.console;

    function formatMillis(ms) {
        return ('        ' + (+ms) + 'ms ').slice(-10);
    }

    function formatEntry(entry, i, collection) {
        var point = entry[0];
        var name = entry[1];
        var timeFromStart = formatMillis(point - collection[0][0]);
        var timeFromLast  = formatMillis(point - (collection[i-1] || collection[0])[0]);

        return timeFromStart + timeFromLast + name;
    }

    // TODO: Break start out into it's own parameters - bandwidth etc. is unreleated to our load time.
    var timing = Mobify.timing = {
        points: [],
        selectors: [],

        addPoint: function(str, date) {
            var point = date || +new Date;         
            this.points.push([point, str]);
            return point;
        },

        addSelector: function(str, date) {
            var point = date || +new Date;         
            this.selectors.push([point, str]);
        },

        logGroup: function(group, name) {
            var processed = group.map(formatEntry);   

            console.groupCollapsed
                ? console.groupCollapsed(name)
                : console.group(name);

            if (console.dir) {
                console.dir(processed);
            } else {
                $.each(processed, function(i, x) {
                    console.log(x);
                });
            }
            console.groupEnd();
        },

        logPoints: function() {
            this.logGroup(this.points, 'Global timing');
            this.logGroup(this.selectors, 'Data evaluation timing');
        },

        // Allow plugins to reset timing for their own use.
        reset: function() {
            this.points = [];
            this.selectors = [];
        }
    };

    timing.addPoint('Finished Document', Mobify.points[1]);
    timing.addPoint('Loaded Mobify.js');

})(Mobify.$, Mobify);
/**
 * Functions for disabling or enabling external resource loading attributes
 * in HTML strings.
 */
(function(Mobify) {

var $ = Mobify.$
  , keys = function(obj) { 
        return $.map(obj, function(val, key) {
            return key 
        }) 
    }
  , values = function(obj) { 
        return $.map(obj, function(val, key) { 
            return val 
        }) 
    }

  , openingScriptRe = new RegExp('(<script[\\s\\S]*?>)', 'gi')

    // Inline styles are scripts are disabled using a unkonwn type.
  , tagDisablers = {
        style: ' media="mobify-media"'
      , script: ' type="text/mobify-script"'
    }
  , tagEnablingRe = new RegExp(values(tagDisablers).join('|'), 'g')
  , disablingMap = { 
        img:    ['src']
      , iframe: ['src']
      , script: ['src', 'type']
      , link:   ['href']
      , style:  ['media']
    }
  , affectedTagRe = new RegExp('<(' + keys(disablingMap).join('|') + ')([\\s\\S]*?)>', 'gi')
  , attributeDisablingRes = {}
  , attributesToEnable = {}
  , attributeEnablingRe
  , HTML = Mobify.html = Mobify.html || {};

// Populate `attributesToEnable` and `attributesToEnable`.
$.each(disablingMap, function(tagName, targetAttributes) {
    $.each(targetAttributes, function(key, value) {
        attributesToEnable[value] = true;
    });

    // Special treatment for images - disable existing width/height attributes.
    if (tagName === 'img') {
        targetAttributes = targetAttributes.concat('width', 'height')
    }

    // <space><attr>='...'|"..."
    attributeDisablingRes[tagName] = new RegExp(
        '\\s+((?:'
        + targetAttributes.join('|')
        + ")\\s*=\\s*(?:'([\\s\\S])+?'|\"([\\s\\S])+?\"))", 'gi');
})

attributeEnablingRe = new RegExp('\\sx-(' + keys(attributesToEnable).join('|') + ')', 'gi');


function disableAttributes(whole, tagName, tail) {
    tagName = tagName.toLowerCase();
    return result = '<' + tagName + (tagDisablers[tagName] || '')
        + tail.replace(attributeDisablingRes[tagName], ' x-$1') + '>';
}

$.extend(HTML, {       
    /**
     * Returns a string with all external attributes disabled.
     * Includes special handling for resources referenced in scripts and inside
     * comments.
     */
    disable: function(htmlStr) {            
        var splitRe = /(<!--[\s\S]*?-->)|(?=<\/script)/i
          , tokens = htmlStr.split(splitRe)
          , ret = tokens.map(function(fragment) {
                var parsed

                // Fragment may be empty or just a comment, no need to escape those.
                if (!fragment) return '';
                if (/^<!--/.test(fragment)) return fragment;

                // Disable before and the <script> itself.
                // parsed = [before, <script>, script contents]
                parsed = fragment.split(openingScriptRe);
                parsed[0] = parsed[0].replace(affectedTagRe, disableAttributes);
                if (parsed[1]) parsed[1] = parsed[1].replace(affectedTagRe, disableAttributes);
                return parsed;
            });

        return [].concat.apply([], ret).join('');
    },

    /**
     * Returns a string with all disabled external attributes enabled.
     */
    enable: function(htmlStr) {
        return htmlStr.replace(attributeEnablingRe, ' $1').replace(tagEnablingRe, '');
    }
});
    
})(Mobify);
(function (document, Mobify) {

var nodeName = function(node) {
        return node.nodeName.toLowerCase();
    }

  , escapeQuote = function(s) {
        return s.replace('"', '&quot;');
    }

    /**
     * Return a string for the opening tag of DOMElement `element`.
     */
  , openTag = function(element) {
        if (!element) return '';
        if (element.length) element = element[0];

        var stringBuffer = [];

        [].forEach.call(element.attributes, function(attr) {
            stringBuffer.push(' ', attr.name, '="', escapeQuote(attr.value), '"');
        })

        return '<' + nodeName(element) + stringBuffer.join('') + '>';
    }

    /**
     * Return a string for the closing tag of DOMElement `element`.
     */
  , closeTag = function(element) {
        if (!element) return '';
        if (element.length) element = element[0];

        return '</' + nodeName(element) + '>';
    }

    /**
     * Return a string for the doctype of the current document.
     */
  , doctype = function(doc) {
        var doctypeEl = doc.doctype || [].filter.call(doc.childNodes, function(el) {
                return el.nodeType == Node.DOCUMENT_TYPE_NODE
            })[0];

        if (!doctypeEl) return '';

        return '<!DOCTYPE HTML'
            + (doctypeEl.publicId ? ' PUBLIC "' + doctypeEl.publicId + '"' : '')
            + (doctypeEl.systemId ? ' "' + doctypeEl.systemId + '"' : '')
            + '>';
    }

    /**
     * Returns a string of the unesacped content from a plaintext escaped `container`.
     */
  , extractHTMLFromElement = function(container) {
        if (!container) return '';

        return [].map.call(container.childNodes, function(el) {
            var tagName = nodeName(el);
            if (tagName == '#comment') return '<!--' + el.textContent + '-->';
            if (tagName == 'plaintext') return el.textContent;
            if (tagName == 'script' && ((/mobify\./.test(el.src) || /Mobify/.test(el.textContent)))) return '';
            return el.outerHTML || el.nodeValue;
        }).join('');
    }

    // Memoize result of extract
  , extractedHTML

    /**
     * Returns an object containing the state of the original page. Caches the object
     * in `extractedHTML` for later use.
     */
  , extractHTML = function(doc) {
        if (extractedHTML) return extractedHTML;

        var doc = doc || document
          , headEl = doc.getElementsByTagName('head')[0] || doc.createElement('head')
          , bodyEl = doc.getElementsByTagName('body')[0] || doc.createElement('body')
          , htmlEl = doc.getElementsByTagName('html')[0];

        extractedHTML = {
            doctype: doctype(doc),
            htmlTag: openTag(htmlEl),
            headTag: openTag(headEl),
            bodyTag: openTag(bodyEl),
            headContent: extractHTMLFromElement(headEl),
            bodyContent: extractHTMLFromElement(bodyEl)
        };

        /**
         * RR: I assume that Mobify escaping tag is placed in <head>. If so, the <plaintext>
         * it emits would capture the </head><body> boundary, as well as closing </body></html>
         * Therefore, bodyContent will have these tags, and they do not need to be added to .all()
         */
        extractedHTML.all = function(inject) {
            return this.doctype + this.htmlTag + this.headTag + (inject || '') + this.headContent + this.bodyContent;
        }

        return extractedHTML;
    }

  , unmobify = Mobify.unmobify = function(doc) {
        doc = doc || document
        if (/complete|loaded/.test(doc.readyState)) {
            unmobifier(doc);
        } else {
            doc.addEventListener('DOMContentLoaded', unmobifier, false);
        }
    }

    /** 
     * Gather escaped content from the DOM, unescaped it, and then use 
     * `document.write` to revert to the original page.
     */
  , unmobifier = function(doc) {
        doc = (doc && doc.target || doc) || document
        doc.removeEventListener('DOMContentLoaded', unmobifier, false);
        var captured = extractHTML(doc);

        // Wait up for IE, which may not be ready to.
        setTimeout(function() {
            var inject = Mobify.ajs && ('<script async src="' + Mobify.ajs + '#t=miss"></script>');

            doc.open();
            doc.write(captured.all(inject));
            doc.close();
        }, 15);
    }
    
  , html = Mobify.html || {}

if (Mobify.$) {
    Mobify.$.extend(html, {
        extractHTML: extractHTML
      , extractHTMLFromElement: extractHTMLFromElement
      , openTag: openTag
      , closeTag: closeTag
    });
} else {
    Mobify.api = 1;
    unmobify();
}

})(document, Mobify);

// provides extractDOM
(function($, Mobify) {

// During capturing, we will usually end up hiding our </head>/<body ... > boundary
// within <plaintext> capturing element. To construct shadow DOM, we need to rejoin
// head and body content, iterate through it to find head/body boundary and expose
// opening <body ... > tag as a string.
var guillotine = function(captured) {
        // Consume comments without grouping to avoid catching
        // <body> inside a comment, common with IE conditional comments.
        var bodySnatcher = /<!--(?:[\s\S]*?)-->|(<\/head\s*>|<body[\s\S]*$)/gi;

        captured = $.extend({}, captured);
        //Fallback for absence of </head> and <body>
        var rawHTML = captured.bodyContent = captured.headContent + captured.bodyContent;
        captured.headContent = '';

        // Search rawHTML for the head/body split.
        for (var match; match = bodySnatcher.exec(rawHTML); match) {
            // <!-- comment --> . Skip it.
            if (!match[1]) continue;

            if (match[1][1] == '/') {
                // Hit </head. Gather <head> innerHTML. Also, take trailing content,
                // just in case <body ... > is missing or malformed
                captured.headContent = rawHTML.slice(0, match.index);
                captured.bodyContent = rawHTML.slice(match.index + match[1].length);
            } else {
                // Hit <body. Gather <body> innerHTML.

                // If we were missing a </head> before, now we can pick up everything before <body
                captured.headContent = captured.head || rawHTML.slice(0, match.index);
                captured.bodyContent = match[0];

                // Find the end of <body ... >
                var parseBodyTag = /^((?:[^>'"]*|'[^']*?'|"[^"]*?")*>)([\s\S]*)$/.exec(match[0]);

                // Will skip this if <body was malformed (e.g. no closing > )
                if (parseBodyTag) {
                    // Normal termination. Both </head> and <body> were recognized and split out
                    captured.bodyTag = parseBodyTag[1];
                    captured.bodyContent = parseBodyTag[2];
                }
                break;
            }
        }
        return captured;
    }

    /**
     * Transform a primitive <tag attr="value" ...> into corresponding DOM element
     * Unlike $('<tag>'), correctly handles <head>, <body> and <html>.
     */
  , makeElement = function(html) {
        var match = html.match(/^<(\w+)([\s\S]*)/i);
        var el = document.createElement(match[1]);

        $.each($('<div' + match[2])[0].attributes, function(i, attr) {
            try {
                el.setAttribute(attr.nodeName, attr.nodeValue);
            } catch(e) {
                console.error("Can't set attribute " + attr.nodeName + " on element " + el.nodeName);
            }
        });

        return el;
    }

  , html = Mobify.html || {};

$.extend(html, {

    // 1. Get the original markup from the document.
    // 2. Disable the markup.
    // 3. Construct the source pseudoDOM.
    extractDOM: function() {
        // Extract escaped markup out of the DOM
        var captured = guillotine(html.extractHTML());

        Mobify.timing.addPoint('Recovered Markup');

        // Disable attributes that can cause loading of external resources
        var disabledHead = this.disable(captured.headContent)
          , disabledBody = this.disable(captured.bodyContent);

        Mobify.timing.addPoint('Disabled Markup');

        // Reinflate HTML strings back into declawed DOM nodes.
        var div = document.createElement('div');
        var headEl = makeElement(captured.headTag);
        var bodyEl = makeElement(captured.bodyTag);
        var htmlEl = makeElement(captured.htmlTag);

        var result = {
            'doctype' : captured.doctype
          , '$head' : $(headEl)
          , '$body' : $(bodyEl)
          , '$html' : $(htmlEl)
        };

        for (div.innerHTML = disabledHead; div.firstChild; headEl.appendChild(div.firstChild));
        for (div.innerHTML = disabledBody; div.firstChild; bodyEl.appendChild(div.firstChild));
        htmlEl.appendChild(headEl);
        htmlEl.appendChild(bodyEl);

        Mobify.timing.addPoint('Built Passive DOM');

        return result;
    },

    makeElement: makeElement
});

})(Mobify.$, Mobify);



    //
// Dust - Asynchronous Templating v0.3.0
// http://akdubya.github.com/dustjs
//
// Copyright (c) 2010, Aleksander Williams
// Released under the MIT License.
//

var dust = {};

(function(dust) {

dust.cache = {};

dust.register = function(name, tmpl) {
  if (!name) return;
  dust.cache[name] = tmpl;
};

dust.render = function(name, context, callback) {
  var chunk = new Stub(callback).head;
  dust.load(name, chunk, Context.wrap(context)).end();
};

dust.stream = function(name, context) {
  var stream = new Stream();
  dust.nextTick(function() {
    dust.load(name, stream.head, Context.wrap(context)).end();
  });
  return stream;
};

dust.renderSource = function(source, context, callback) {
  return dust.compileFn(source)(context, callback);
};

dust.compileFn = function(source, name) {
  var tmpl = dust.loadSource(dust.compile(source, name));
  return function(context, callback) {
    var master = callback ? new Stub(callback) : new Stream();
    dust.nextTick(function() {
      tmpl(master.head, Context.wrap(context)).end();
    });
    return master;
  }
};

dust.load = function(name, chunk, context) {
  var tmpl = dust.cache[name];
  if (tmpl) {
    return tmpl(chunk, context);
  } else {
    if (dust.onLoad) {
      return chunk.map(function(chunk) {
        dust.onLoad(name, function(err, src) {
          if (err) return chunk.setError(err);
          if (!dust.cache[name]) dust.loadSource(dust.compile(src, name));
          dust.cache[name](chunk, context).end();
        });
      });
    }
    return chunk.setError(new Error("Template Not Found: " + name));
  }
};

dust.loadSource = function(source, path) {
  return eval(source);
};

if (Array.isArray) {
  dust.isArray = Array.isArray;
} else {
  dust.isArray = function(arr) {
    return Object.prototype.toString.call(arr) == "[object Array]";
  };
}

dust.nextTick = function(callback) {
  setTimeout(callback, 0);
}

dust.isEmpty = function(value) {
  if (dust.isArray(value) && !value.length) return true;
  if (value === 0) return false;
  return (!value);
};

dust.filter = function(string, auto, filters) {
  if (filters) {
    for (var i=0, len=filters.length; i<len; i++) {
      var name = filters[i];
      if (name === "s") {
        auto = null;
      } else {
        string = dust.filters[name](string);
      }
    }
  }
  if (auto) {
    string = dust.filters[auto](string);
  }
  return string;
};

dust.filters = {
  h: function(value) { return dust.escapeHtml(value); },
  j: function(value) { return dust.escapeJs(value); },
  u: encodeURI,
  uc: encodeURIComponent
}

function Context(stack, global, blocks) {
  this.stack  = stack;
  this.global = global;
  this.blocks = blocks;
}

dust.makeBase = function(global) {
  return new Context(new Stack(), global);
}

Context.wrap = function(context) {
  if (context instanceof Context) {
    return context;
  }
  return new Context(new Stack(context));
}

Context.prototype.get = function(key) {
  var ctx = this.stack, value;

  while(ctx) {
    if (ctx.isObject) {
      value = ctx.head[key];
      if (!(value === undefined)) {
        return value;
      }
    }
    ctx = ctx.tail;
  }
  return this.global ? this.global[key] : undefined;
};

Context.prototype.getPath = function(cur, down) {
  var ctx = this.stack,
      len = down.length;

  if (cur && len === 0) return ctx.head;
  if (!ctx.isObject) return undefined;
  ctx = ctx.head;
  var i = 0;
  while(ctx && i < len) {
    ctx = ctx[down[i]];
    i++;
  }
  return ctx;
};

Context.prototype.push = function(head, idx, len) {
  return new Context(new Stack(head, this.stack, idx, len), this.global, this.blocks);
};

Context.prototype.rebase = function(head) {
  return new Context(new Stack(head), this.global, this.blocks);
};

Context.prototype.current = function() {
  return this.stack.head;
};

Context.prototype.getBlock = function(key) {
  var blocks = this.blocks;

  if (!blocks) return;
  var len = blocks.length, fn;
  while (len--) {
    fn = blocks[len][key];
    if (fn) return fn;
  }
}

Context.prototype.shiftBlocks = function(locals) {
  var blocks = this.blocks;

  if (locals) {
    if (!blocks) {
      newBlocks = [locals];
    } else {
      newBlocks = blocks.concat([locals]);
    }
    return new Context(this.stack, this.global, newBlocks);
  }
  return this;
}

function Stack(head, tail, idx, len) {
  this.tail = tail;
  this.isObject = !dust.isArray(head) && head && typeof head === "object";
  this.head = head;
  this.index = idx;
  this.of = len;
}

function Stub(callback) {
  this.head = new Chunk(this);
  this.callback = callback;
  this.out = '';
}

Stub.prototype.flush = function() {
  var chunk = this.head;

  while (chunk) {
    if (chunk.flushable) {
      this.out += chunk.data;
    } else if (chunk.error) {
      this.callback(chunk.error);
      this.flush = function() {};
      return;
    } else {
      return;
    }
    chunk = chunk.next;
    this.head = chunk;
  }
  this.callback(null, this.out);
}

function Stream() {
  this.head = new Chunk(this);
}

Stream.prototype.flush = function() {
  var chunk = this.head;

  while(chunk) {
    if (chunk.flushable) {
      this.emit('data', chunk.data);
    } else if (chunk.error) {
      this.emit('error', chunk.error);
      this.flush = function() {};
      return;
    } else {
      return;
    }
    chunk = chunk.next;
    this.head = chunk;
  }
  this.emit('end');
}

Stream.prototype.emit = function(type, data) {
  var events = this.events;

  if (events && events[type]) {
    events[type](data);
  }
}

Stream.prototype.on = function(type, callback) {
  if (!this.events) {
    this.events = {};
  }
  this.events[type] = callback;
  return this;
}

function Chunk(root, next, taps) {
  this.root = root;
  this.next = next;
  this.data = '';
  this.flushable = false;
  this.taps = taps;
}

Chunk.prototype.write = function(data) {
  var taps  = this.taps;

  if (taps) {
    data = taps.go(data);
  }
  this.data += data;
  return this;
}

Chunk.prototype.end = function(data) {
  if (data) {
    this.write(data);
  }
  this.flushable = true;
  this.root.flush();
  return this;
}

Chunk.prototype.map = function(callback) {
  var cursor = new Chunk(this.root, this.next, this.taps),
      branch = new Chunk(this.root, cursor, this.taps);

  this.next = branch;
  this.flushable = true;
  callback(branch);
  return cursor;
}

Chunk.prototype.tap = function(tap) {
  var taps = this.taps;

  if (taps) {
    this.taps = taps.push(tap);
  } else {
    this.taps = new Tap(tap);
  }
  return this;
}

Chunk.prototype.untap = function() {
  this.taps = this.taps.tail;
  return this;
}

Chunk.prototype.render = function(body, context) {
  return body(this, context);
}

Chunk.prototype.reference = function(elem, context, auto, filters) {
  if (typeof elem === "function") {
    elem = elem(this, context, null, {auto: auto, filters: filters});
    if (elem instanceof Chunk) {
      return elem;
    }
  }
  if (!dust.isEmpty(elem)) {
    return this.write(dust.filter(elem, auto, filters));
  } else {
    return this;
  }
};

Chunk.prototype.section = function(elem, context, bodies, params) {
  if (typeof elem === "function") {
    elem = elem(this, context, bodies, params);
    if (elem instanceof Chunk) {
      return elem;
    }
  }

  var body = bodies.block,
      skip = bodies['else'];

  if (params) {
    context = context.push(params);
  }

  if (dust.isArray(elem)) {
    if (body) {
      var len = elem.length, chunk = this;
      for (var i=0; i<len; i++) {
        chunk = body(chunk, context.push(elem[i], i, len));
      }
      return chunk;
    }
  } else if (elem === true) {
    if (body) return body(this, context);
  } else if (elem || elem === 0) {
    if (body) return body(this, context.push(elem));
  } else if (skip) {
    return skip(this, context);
  }
  return this;
};

Chunk.prototype.exists = function(elem, context, bodies) {
  var body = bodies.block,
      skip = bodies['else'];

  if (!dust.isEmpty(elem)) {
    if (body) return body(this, context);
  } else if (skip) {
    return skip(this, context);
  }
  return this;
}

Chunk.prototype.notexists = function(elem, context, bodies) {
  var body = bodies.block,
      skip = bodies['else'];

  if (dust.isEmpty(elem)) {
    if (body) return body(this, context);
  } else if (skip) {
    return skip(this, context);
  }
  return this;
}

Chunk.prototype.block = function(elem, context, bodies) {
  var body = bodies.block;

  if (elem) {
    body = elem;
  }

  if (body) {
    return body(this, context);
  }
  return this;
};

Chunk.prototype.partial = function(elem, context) {
  if (typeof elem === "function") {
    return this.capture(elem, context, function(name, chunk) {
      dust.load(name, chunk, context).end();
    });
  }
  return dust.load(elem, this, context);
};

Chunk.prototype.helper = function(name, context, bodies, params) {
  return dust.helpers[name](this, context, bodies, params);
};

Chunk.prototype.capture = function(body, context, callback) {
  return this.map(function(chunk) {
    var stub = new Stub(function(err, out) {
      if (err) {
        chunk.setError(err);
      } else {
        callback(out, chunk);
      }
    });
    body(stub.head, context).end();
  });
};

Chunk.prototype.setError = function(err) {
  this.error = err;
  this.root.flush();
  return this;
};

dust.helpers = {
  sep: function(chunk, context, bodies) {
    if (context.stack.index === context.stack.of - 1) {
      return chunk;
    }
    return bodies.block(chunk, context);
  },

  idx: function(chunk, context, bodies) {
    return bodies.block(chunk, context.push(context.stack.index));
  },

  count: function(chunk, context, bodies) {
    return bodies.block(chunk, context.push(context.stack.index + 1));
  }
}

function Tap(head, tail) {
  this.head = head;
  this.tail = tail;
}

Tap.prototype.push = function(tap) {
  return new Tap(tap, this);
};

Tap.prototype.go = function(value) {
  var tap = this;

  while(tap) {
    value = tap.head(value);
    tap = tap.tail;
  }
  return value;
};

var HCHARS = new RegExp(/[&<>\"]/),
    AMP    = /&/g,
    LT     = /</g,
    GT     = />/g,
    QUOT   = /\"/g;

dust.escapeHtml = function(s) {
  if (typeof s === "string") {
    if (!HCHARS.test(s)) {
      return s;
    }
    return s.replace(AMP,'&amp;').replace(LT,'&lt;').replace(GT,'&gt;').replace(QUOT,'&quot;');
  }
  return s;
};

var BS = /\\/g,
    CR = /\r/g,
    LS = /\u2028/g,
    PS = /\u2029/g,
    NL = /\n/g,
    LF = /\f/g,
    SQ = /'/g,
    DQ = /"/g,
    TB = /\t/g;

dust.escapeJs = function(s) {
  if (typeof s === "string") {
    return s
      .replace(BS, '\\\\')
      .replace(DQ, '\\"')
      .replace(SQ, "\\'")
      .replace(CR, '\\r')
      .replace(LS, '\\u2028')
      .replace(PS, '\\u2029')
      .replace(NL, '\\n')
      .replace(LF, '\\f')
      .replace(TB, "\\t");
  }
  return s;
};

})(dust);

/* Removed because we do not use this as a module. Even on server side(for now)
if (typeof exports !== "undefined") {
  if (typeof process !== "undefined") {
      require('./server')(dust);
  }
  module.exports = dust;
}
*/


    (function($) { 
    
var console = Mobify.console

  , gatherEmpties = function(assignment, ref, value) {
        var root = this.root
          , warnings = root.warnings = root.warnings || {}
          , overwrites = root.overwrites = root.overwrites || {}
          , isEmpty = (value === null) || (value === undefined) || (value === '')
                   || ((typeof value.length != 'undefined')  && !value.length)
                   || (value instanceof Error)
                   || (!value && (this.get('laziness') > 0));
       
        if (ref && (assignment.importance > -1)) {
            if (isEmpty) {
                warnings[ref.crumbs] = value;
            } else {
                delete warnings[ref.crumbs];
            }
            if ((ref.value !== undefined) && (!ref.value._async)) {
                overwrites[ref.crumbs] = value;
            }
        } 
    }

  , logResult = function(value) {
        if (!this.tail) {
            console.logGroup('warn', 'Unfilled values', this.warnings);
            console.logGroup('warn', 'Missing -> Wrappers', this.forgotten || []);
            console.logGroup('log', 'Overwrites', this.overwrites);
            console.logGroup('log', 'Choices', this.choices || []);

            console.group('All extracted data');
            console.log(value);
            console.groupEnd();  
        }
    }

  , Async = function(cont, start) {
        var async = function(chunk) {
                var args = arguments;
                return chunk.map(function(chunk) {
                    var handler = function(result) {
                        if (args[3] === "exists")
                            return chunk.exists(result, args[1], args[2]).end();

                        if (args[3] === "notexists")
                            return chunk.notexists(result, args[1], args[2]).end();

                        return (args[2] === null)
                             ? chunk.reference(result, args[1], args[3].auto, args[3].filters).end()
                             : chunk.section(result, args[1], args[2], args[3]).end();
                    }
                    listeners.push(handler);
                });
            }

          , listeners = [], result, done;

        async.onresult = function(f) {
            if (done) {
                f.call(async, result);
            } else {
                listeners.push(f);
            }
        }

        async.finish = function(value) {
            result = value;
            done = true;
            $.each(listeners, function(i, f) {
                f.call(async, value)
            });
        }

        async._async = true;

        start.call(cont.env().head, cont, async);

        return done ? result : async;
    }

  , anchor = function($root) {
        var rootedQuery = function(selector, context, rootQuery) {
                $root = $root || (Mobify.conf.data && Mobify.conf.data.$html);

                return ($.fn.init || $.zepto.init).call(this, selector, context || anchored.context(), rootQuery);
            }

          , anchored = $.sub(rootedQuery); 

        anchored.context = function() {
            return $root || (Mobify.conf.data ? Mobify.conf.data.$html : '<div>');
        }

        if (!anchored.zepto)  {
            anchored.fn.init = rootedQuery;
            anchored.fn.init.prototype = $.fn;
        }

        return anchored;
    };

$.sub = $.sub || function(rootedQuery) {
    $.extend(rootedQuery, $);
    rootedQuery.zepto = $.extend({}, $.zepto);
    return rootedQuery;
};

$.fn.anchor = function() {
    return anchor(this);
};

Mobify.data2 = {
    gatherEmpties: gatherEmpties

  , makeCont: function(opts) {
        var cont = new Mobify.data2.cont($.extend({}, {laziness: -1 }, opts));
        if (Mobify.config.isDebug) {
            cont
                .on('assignReference', gatherEmpties)
                .on('complete', logResult);
        }
        return cont;
    }

  , Async: Async

  , M: {
        $ : anchor(), 
        async: Async
    }
};
    
})(Mobify.$);
    (function($, Mobify) {
    var Stack = Mobify.data2.stack = function(head, parent, idx, len) {
        this.tail = parent;
        this.head = head;
        this.index = idx;
        this.len = len;
    }
    ,refRe = /^[^!?.]*(\.[^!?.]+)*$/i;

    Stack.prototype = {
         _mobifyStack: true
        ,extend : function(head, idx, len) {
            return new Stack(head, this, idx, len);
        }
        ,crumbs: function() {
            var crumbs = [];
            for (var walk = this; walk.tail; walk = walk.tail) {
                if (walk.index !== undefined) crumbs.unshift(walk.index);
            }

            crumbs.toString = function() { return this.join('.') };
            return crumbs;
        }
        ,get: function(key) {
            var stack = this;
            while (!(key in stack.head) && stack.tail)
                stack = stack.tail;
            return stack.head && stack.head[key];
        }
        ,set: function(key, value) {
            return this.head[key] = value;
        }
        ,ref: function(selector, preferLocalAssignment) {
                       
            var  parsed = (selector || "").toString().match(refRe)
                ,stack = this, tokens, token, crumbs, head;

            if (!parsed) return;

            tokens = parsed[0].split('.');
            token = tokens[0];

            if (token
                // If token is numeric and stack.head is an array, we should
                // disable ascending logic and force local assignment. Otherwise,
                // we risk ending up with unwanted overwrites in cases of nested arrays
                && (isNaN(token) || !$.isArray(stack.head))) {
                while (!(token in stack.head) && stack.tail)
                    stack = stack.tail;
            }
            if (!(token in stack.head) && preferLocalAssignment) stack = this;

            crumbs = stack.crumbs();
            crumbs.pop();
            crumbs.push.apply(crumbs, tokens);

            head = stack.head;

            var value = head,
                i = 0;
            while ((tok = tokens[i++]) !== undefined) {
                if (tok == "") {
                    value = head;
                } else {
                    head = value;
                    token = tok;
                    value = head ? head[tok] : undefined; 
                }
            }

            if ((head && (token in head)) || preferLocalAssignment) return {
                 target: head
                ,value: value
                ,key: token
                ,crumbs: crumbs
            }
        }
    };
})(Mobify.$, Mobify);
    (function($, Mobify, undefined) {
    var decodeAssignmentRe = /^([?!]?)(.*)$/
        ,Location = window.Location
        ,Stack = Mobify.data2.stack
        ,Async = Mobify.data2.Async
        ,Cont = Mobify.data2.cont = function(head, parent, idx, len, newEnv) {
            Stack.call(this, head, parent, idx, len);

            if (!parent) {
                var root = this.root = this;
                this.handlers = {}
                this.pending = 0;
            } else {
                this.root = parent.root;
            }

            var oldEnv = parent && parent.env();
            if (newEnv) {
                this.env(oldEnv.extend(newEnv, idx, len));
            } else if (!oldEnv) {
                this.env(new Stack(newEnv || {}));
            }
        };

    $.extend(Cont, {
        importance : {'!' : 1, '?' : -1, '' : 0}
        ,decodeAssignment : function(selector) {
            parse = selector.toString().match(decodeAssignmentRe);
            return {
                 importance: this.importance[parse[1]]
                ,selector: parse[2]
            }
        }
    });

    Cont.prototype = $.extend(new Stack(), {
         extend: function(head, idx, len, env) {
            return new Cont(head, this, idx, len, env);
        }
        ,env: function(value) {
            return (value !== undefined)
                ? this.set('env', value)
                : this.get('env');
        }
        ,source: function(value) {
            return (value !== undefined)
                ? this.set('source', value)
                : this.get('source');
        }
        ,all: function() {
            var env;
            for (env = this.env(); env.tail.tail; env = env.tail);
            return env.head;
        }
        ,blankTarget: function() {
            var source = this.source();
            if ($.isArray(source)) return [];
            if ($.isPlainObject(source)) return {};
        }
        ,_eval : function(source) {
            var root = this.root;

            var innerCont = this.extend({source: source}, this.index, this.length);
            //innerCont.head.root = innerCont;

            var result = innerCont.eval();
            return result;
        }
        ,eval: function(source) {
            if (source !== undefined) {
                return this._eval(source);
            }
            var blank = this.blankTarget();
            var value = blank
                    ? this.evalCollection(blank)
                    : this.evalLeaf()
                ,root = this.root;
            if (!this.parent && (this === root)) {
                if (root.pending) {
                    if (!root.incomplete) {
                        root.incomplete = true;
                        this.on('assignReference', function() {
                            if (!root.pending) {
                                root.emit('complete', [this.all(), this]);
                            }
                        });
                    }
                } else root.emit('complete', [value, this]);
            }
            return value;
        }        
        ,evalLeaf : function() {
            var source = this.source();
            try {
                if (!source) return source;

                return ($.isFunction(source) && !source._async)
                    ? source.call(this.env().head, this)
                    : source;
            } catch (e) { return e; }
        }   
        ,evalCollection : function(value) {
            var source = this.source(),
                sourceLength = source.length,
                continuation = this;
 
            $.each(source, function(idx, sourceFragment) {
                if (sourceFragment && (sourceFragment.jquery || sourceFragment.nodeType)
                    && (typeof idx == "string") && idx.indexOf('$')) {
                    var root = continuation.root;
                    var forgotten = root.forgotten = root.forgotten || [];
                    forgotten.push([idx, sourceFragment]);
                }
                continuation
                    .extend({source: sourceFragment}, idx, sourceLength, value)
                    .evalReference();
            });
            return value;
        }

        ,evalReference : function() {
            
            var ref, value, cont = this 
              , assignment = Cont.decodeAssignment(this.index);
            
            if (assignment.importance >= this.get('laziness')) {
                this.ref = ref = this.env().ref(assignment.selector, true);
                if (!ref) {
                    Mobify.console.warn(assignment.selector
                        , " has a syntax error or points to object that does not exist");
                    return;
                }
            } else return;
            value = this.eval();
            if (value && value._async) {

                ref.value = value;
                if (ref.target && ref.key) {
                    ref.target[ref.key] = value;
                }
                var root = cont.root;

                value.onresult(function(value) {
                    root.pending -= 1;
                    cont.assignReference(assignment, ref, value);
                });
                
                root.pending += 1;
            } else this.assignReference(assignment, ref, value);
            return value;
        }
        ,assignReference: function(assignment, ref, value) {
            if (!(value instanceof Error)) {
                if (ref.target && ref.key) {
                    ref.target[ref.key] = value;
                } else if (this.tail) {
                    value = new Error(assignment.selector + " value can't be saved to " + ref.crumbs);
                }
            }
            this.emit('assignReference', [assignment, ref, value]);
            if (Mobify.config.isDebug) Mobify.timing.addSelector(ref.crumbs);
            
            return value;            
        }
        ,choose : function() {
            var cont = this
                ,root = cont.root
                ,forgotten = root.forgotten = root.forgotten || []
                ,branches = arguments
                ,choices = root.choices = root.choices || {}
                ,chosen = ([].some.call(branches, function(branch, idx) {
                    var attempt = new Mobify.data2.cont({source: branch, laziness: 1});
                    attempt.root = attempt;
                    attempt.env(cont.env().extend({}));
                    
                    attempt.on('assignReference', Mobify.data2.gatherEmpties).eval();
                    
                    [].push.apply(root.forgotten, attempt.forgotten || []);

                    for (var firstWarning in attempt.warnings) break;
                    if (!firstWarning) chosen = branch;
                    return !firstWarning;
                }), chosen)
                ,chosenCont = cont.extend({source: chosen}, cont.index, cont.of);
            
            if (chosen) {
                return choices[cont.ref.crumbs] = chosenCont.eval();
            }
        }
        ,map: function(source, evaluatable) {
            var sourceLength = source.length
                ,continuation = this
                ,result;
 
            result = $.map(source, function(sourceFragment, idx) {
                var cont = continuation
                    .extend({source: evaluatable}, idx, sourceLength, {
                        $: sourceFragment.tagName && $(sourceFragment).anchor()
                        , KEY: idx, LEN: sourceLength, THIS: sourceFragment
                    });
                return cont.eval();
            });
            return result;            
            
        }
        ,ajax: function(params, evaluatable) {
            return Async(this, function(cont, async) {
                $.ajax(cont.eval(params))
                    .success( function(responseData, status, xhr) {
                        if (!evaluatable) {
                            async.finish(responseData);
                        } else if (typeof responseData !== "string") {
                            cont.env(cont.env().extend({THIS: responseData}));
                            async.finish(cont.eval(evaluatable));
                        } else {
                            var context = $(Mobify.html.disable(responseData));
                            cont.env(cont.env().extend({THIS: context, $: context.anchor()}));
                            async.finish(cont.eval(evaluatable));
                        }
                    }).error(function() {
                        async.finish(null);
                    })
            });
        }
        ,tmpl: function(template, data) {
            var args = arguments;
            if (template instanceof Array) template = template[0];

            return Async(this, function(cont, async) {
                var base = dust.makeBase({ lib_import: Mobify.ark.dustSection });

                if (args.length == 1) data = cont.all();
                dust.render(template, base.push(data), function(err, out) {
                    if (err) {
                        async.finish(out);
                        Mobify.console.die(err);
                    } else async.finish(out);
                });
            });
        }
        ,data: function(selector, value) {
            var  get = (value === undefined)
                ,ref = this.env().ref(selector);

            if (!ref) return;

            return get
                ? ref.value
                : ref.target[ref.key] = value;
        }
        ,on: function(event, handler) {
            var allHandlers = this.root.handlers,
                handlers = allHandlers[event] = allHandlers[event] || [];

            handlers.push(handler);           
            return this;
        }
        ,emit: function(event, args) {
            var current = this
                ,continuation = this
                ,allHandlers = this.root.handlers;

            $.each(allHandlers[event] || [], function(i, handler) {
                handler.apply(continuation, args);
            });
        }
    });

})(Mobify.$, Mobify);
    (function($, Mobify) {

var Async = Mobify.data2 && Mobify.data2.Async
  , Context = dust.makeBase({}).constructor
  , Chunk = dust.stream('', {}).head.constructor
  , oldExists = Chunk.prototype.exists
  , oldNotExists = Chunk.prototype.notexists
  , oldBlock = Chunk.prototype.block;
    
Chunk.prototype.exists = function(elem, context, bodies) {
    if (typeof elem === "function") {
        elem = elem(this, context, bodies, 'exists');
        if (elem instanceof Chunk) {
          return elem;
        }
    }
    return oldExists.call(this, elem, context, bodies);
};

Chunk.prototype.notexists = function(elem, context, bodies) {
    if (typeof elem === "function") {
        elem = elem(this, context, bodies, 'notexists');
        if (elem instanceof Chunk) {
          return elem;
        }
    }
    return oldNotExists.call(this, elem, context, bodies);
};

Chunk.prototype.block = function(elem, context, bodies) {
    var topElem = elem ? elem.shift() : undefined;
    if (topElem) {          
        context = new context.constructor(
                    context.stack, 
                    $.extend(context.global || {}, {
                        '_SUPER_': function(_elem, context, _bodies) {
                            return _elem.block(elem, context, bodies);
                        }})
                    , context.blocks);
    }
    
    return oldBlock.call(this, topElem, context, bodies);
};

var descend = function(ctx, down, i) {
        while (ctx && i < down.length) {
            if (ctx._async) {
                var unwrap = Async($.noop);
                ctx.onresult.push(function(result) {
                    unwrap.result(descend(result, down, i));
                });
                return unwrap;
            }
            ctx = ctx[down[i]];
            i++;
        }        
        return ctx;
    }

Context.prototype.getAscendablePath = function(cur, down) {
    var ctx = this.stack;

    if (cur) return this.getPath(cur, down);
    if (!ctx.isObject) return undefined;

    ctx = this.get(down[0]);

    return descend(ctx, down, 1);
};    

Context.prototype.getBlock = function(key) {
    var blocks = this.blocks;

    if (!blocks) return [];

    blocks = $.map(blocks, function(block) {
        return block[key];
    });
    return blocks;
}
    
var likeArray = function(candidate) {
        return (typeof candidate != 'string') 
            && (typeof candidate.length == 'number')
            && (!candidate.tagName);
    };

// Additional dust filters
// html returns node outerHTML
// innerHTML returns node innerHTML
// openTag and closeTag return first opening and last closing tags from a string
$.extend(dust.filters, {
    h: function(node) {
        if (!node) return '';
        if (likeArray(node)) {
            return $.map(node, dust.filters.h).join('');
        }

        return (typeof node.outerHTML !== 'undefined')
            ? node.outerHTML
            : dust.escapeHtml(node);
    }
    
  , innerHTML: function(node) {
        if (!node) return '';
        if (likeArray(node)) {
            return $.map(node, function(el) {
                return el.innerHTML || el.nodeValue;
            }).join('')
        } else {
            return $(node).html();
        }
    }
  , openTag: Mobify.html.openTag

  , closeTag: Mobify.html.closeTag
});

var conditionalHelper = function(chunk, context, bodies, accept) {
    if (accept) {
        return bodies.block(chunk, context);
    } else if (bodies['else']) {
        return bodies['else'](chunk, context);
    } else {
        return chunk;
    }
}

$.extend(dust.helpers, {
    first: function(chunk, context, bodies) {
        var accept = context.stack.index === 0;
        return conditionalHelper(chunk, context, bodies, accept);
    },
    last: function(chunk, context, bodies) {
        var accept = context.stack.index === context.stack.of - 1;
        return conditionalHelper(chunk, context, bodies, accept);
    }
})
    
var oldIsArray = dust.isArray;
dust.isArray = function(arr) {
    return (arr && arr.appendTo) || oldIsArray(arr);
}

var oldLoad = dust.load;
dust.load = function(name, chunk, context) {
    return name ? oldLoad.apply(this, arguments) : chunk;
}
                
})(Mobify.$, Mobify);



/**
 * Variables injected at build time.
 */
(function(Mobify) {

var config = Mobify.config = Mobify.config || {};

// Stamp calls to the imageresizer.
config.projectName = 'project1-1';

// We're in debug mode if this isn't a production compilation.
config.isDebug = 1;

})(Mobify);

(function() {
    var config = Mobify.config = Mobify.config || {};

    // If loaded with preview, set debug, otherwise debug is off.
    var match = /mobify-path=([^&;]*)/g.exec(document.cookie);
    config.isDebug = config.isDebug || (match && match[1] ? 1 : 0);

    // configFile my already exists if rendering server side, so only grab mobify.js script tag 
    // if configFile is undefined.
    // V6 moved mobify.js to the first script.
    if (!config.configFile) {
        config.configFile = Mobify.$('script[src*="mobify.js"]').first().attr('src') || '';
    }
    config.configDir = config.configFile.replace(/\/[^\/]*$/, '/');
    config.ajs = Mobify.ajs;
})();

Mobify.ark.store("enhance",function(){
    (function(window, $) {

// Android `orientation` support is broken.
var supportsOrientation = $.support.orientation
    = 'orientation' in window && 'onorientationchange' in window
        && !/android/i.test(navigator.userAgent)

    // Returns 'landscape' or 'portrait' based on the current orientation.
  , getOrientation = function() {
        var docEl = document.documentElement;
        return !!(supportsOrientation
            // 0 in portrait, 1 in landscape
            ? orientation % 180 
            // false in portrait, true in landscape
            : docEl.clientWidth > docEl.clientHeight)
        ? 'landscape'
        : 'portrait';
    }

    // Some Android browsers (HTC Sensation) don't update widths immediately,
    // so wait to trigger the event.
  , prevWidth
  , timeout
  , ersatzOrientation = function() {
        clearTimeout(timeout);
        var width = document.documentElement.clientWidth;
        if (width == prevWidth) {
            return timeout = setTimeout(ersatzOrientation, 250);
        }
        prevWidth = width;
        $(window).trigger('orientationchange');
        dispatchListeners();
    }

  , lastOrientation = getOrientation()
  , listeners = []
  , dispatchListeners = function() {
        var orientation = getOrientation(),
            prev = lastOrientation;

        if (orientation != lastOrientation) {
            lastOrientation = orientation;

            // We have this strange order and an extra variable
            // to ensure that exception in a listener would not leave
            // lastOrientation not updated
            for (var i = 0, l = listeners.length; i < l; ++i) {
                listeners[i](orientation, prev);
            }
        }
    }

  , evName = supportsOrientation ? "orientationchange" : "resize"
  , handler = supportsOrientation ? dispatchListeners : ersatzOrientation
  , ensureOrientationHandler = function() {
        $(window).unbind(evName, handler).bind(evName, handler);
    }

Mobify.orientation = function(fn) {
    if (!fn) return getOrientation();
    ensureOrientationHandler();
    listeners.push(fn);
}  

})(this, Mobify.$);
    // Polyfills the `orientationchange` event.
// Exposes Touch, OS, HD and Orientation properties on `Mobify.config`.
// x-desktop, x-ios, x-android, x-blackberry, x-webos, x-nokia, x-bb10
// x-notouch, x-touch
// x-landscape, x-portrait
// x-sd, x-hd x-hd15 x-hd20
//
// TODO: Windows Phone
// http://windowsteamblog.com/windows_phone/b/wpdev/archive/2011/03/22/targeting-mobile-optimized-css-at-windows-phone-7.aspx
(function(window, document, $) {

// ###
// # Device Properties
// ###

var $test = $('<div>', {id: 'mc-test'})
  , style = $test[0].style

    // Touch:
  , touch = 'ontouchend' in document

    // OS: ios, android, nokia, blackberry, webos, desktop
  , osMatch = /(ip(od|ad|hone)|android|nokia|blackberry|webos|bb10)/gi.exec(navigator.userAgent)
  , os = (osMatch && (osMatch[2] ? 'ios' : osMatch[1].toLowerCase())) || 'desktop'

  , tablet = /ipad|android(?!.*mobile)/i.test(navigator.userAgent)

  , smartphone = ((os != 'desktop') && !tablet)

    // Device Pixel Ratio: 1, 1.5, 2.0
  , dpr = 1
  , q = [
        'screen and (-webkit-min-device-pixel-ratio:1.5)', 
        'screen and (-webkit-min-device-pixel-ratio:2)'
    ];
// Use `devicePixelRatio` if available, falling back to querying using
// `matchMedia` or manual media queries.
if ('devicePixelRatio' in window) {
    dpr = devicePixelRatio
} else if (window.matchMedia) {
    dpr = (matchMedia(q[1]).matches && 2) || (matchMedia(q[0]).matches && 1.5);
} else {
    var testHTML = '<style>'
            + '@media ' + q[0] + '{#mc-test{color:red}}'
            + '@media ' + q[1] + '{#mc-test{color:blue}}'
            + '</style>'
      , color
      , m;
    
    $test.hide().html(testHTML).appendTo(document.documentElement);

    color = $test.css('color');

    $test.remove();

    // red  - rgb(255,0,0) - q[0] - 1.5
    // blue - rgb(0,0,255) - q[1] - 2.0
    if (m = /255(\))?/gi.exec(color)) {
        dpr = (m[1] && 2) || 1.5;
    }
}

// ###
// # Mobify.config
// ###

// Expose Touch, OS, HD and Orientation properties on `Mobify.config` for
// use in templating.

var config = Mobify.config || {};
config.os = os;
config.tablet = tablet;
config.smartphone = smartphone;
config.touch = touch;
config.orientation = Mobify.orientation();

if (dpr > 1) {
    config.HD = '@2x';
    config.pixelRatio = dpr;
} else {
    config.HD = '';
}

// ###
// # Mobify.enhance
// ###

// Update orientation class on `orientationchange`.
// Add classes for Touch, OS, HD and Orientation to the HTML element.
// .os
// .orientation
// .touch or .no-touch

// ???
// .sd or .hd .hd15 .hd2
// .dpr1 .dpr15 .dpr2
Mobify.enhance = function() {
    
    var classes = [os, (!touch ? 'no' : '') + 'touch', Mobify.orientation()];

    if (dpr > 1) {
        classes.push('hd' + (dpr + '').replace(/[^\w]/, ''), 'hd');
    } else {
        classes.push('sd');
    }

    $('html').addClass('x-' + classes.join(' x-'));

    Mobify.orientation(function(orientation, prevOrientation) {
        $('html').removeClass('x-' + prevOrientation).addClass('x-' + orientation);
    });
};

})(this, document, Mobify.$);

},false);

/*

Processing order description

1. Escaping

The Mobify tags identities whether a browser should recieve the transformation.
If so, it escapes the document, allowing for markup capture without loading
external resources.

2. Source DOM Construction

The escaped markup is retrieved from the DOM as a string. The escaped markup is 
transformed into a DOM node after resource loading attributes are escaped.

3. Data select

A data object is created by select nodes from the source DOM using DOM methods.

4. Markup generation.

A dust template is rendered with the data as a context, producing the final HTML.

5. Document replacement

The current document is replaced by using document.open/write/close. This makes 
the browser behave as if the templated HTML was the regular source.

*/
(function(document, $, Mobify) {

var timing = Mobify.timing
  , transform = Mobify.transform = Mobify.transform || {};

$.extend(Mobify.transform, {
    // Read the conf, extract the Source DOM and begin the evaluation.
    prepareConf : function(rawConf) {
        var capturedState = Mobify.html.extractDOM();
        capturedState.config = Mobify.config;
        
        // If conf is using data2 evaluation in a {+conf} or {+konf}, this call would provide
        // an interpretable source data object. 
        // If conf is using just a function(), the return value is not useful,
        // as result HTML would be provided as sole argument of a callback.
        var conf = Mobify.conf = rawConf.call(
            Mobify.data2 && Mobify.data2.M,
            capturedState,
            transform.acceptData // This is escape path for function-based confs
        );

        // And this is the normal data evaluation
        if (conf && conf.data) {
            timing.addPoint('Setup Conf');
            conf.data = $.extend(capturedState, conf.data);
            Mobify.evaluatedData = undefined;

            var cont = Mobify.data2.makeCont({source: capturedState})
                .on('complete', transform.acceptData);

            timing.addPoint('Prepared conf for evaluation');
            timing.addSelector('Start');
            cont.eval();
        }
    },

    // `acceptData` is exposed on `Mobify` so it can be overridden for server-side adaptation.
    // Called when the `konf` has been evaluated.
    acceptData: function(data, cont) {     
        if (!Mobify.evaluatedData) {
            Mobify.evaluatedData = data;
            Mobify.evaluatedCont = cont;
            timing.addPoint('Evaluated Conf');
        }
        
        var outputHTML = (typeof data == "string") ? data : data.OUTPUTHTML;
        var enabled = Mobify.html.enable(outputHTML || '');
        timing.addPoint('Enabled Markup');
        transform.emitMarkup(enabled);
    },

    emitMarkup: function(markup) {
        timing.addPoint('DOMContentLoaded');

        if (!markup) {
            Mobify.console.warn('Output HTML is empty, unmobifying.');
            return Mobify.unmobify();
        }

        timing.addPoint('Writing Document');

        if (Mobify.config.isDebug) {
            timing.logPoints();
        }

        // We'll write markup a tick later, as Firefox logging is async
        // and gets interrupted if followed by synchronous document.open
        window.setTimeout(function(){
            // `document.open` clears events bound to `document`.
            document.open();

            // In Webkit, `document.write` immediately executes inline scripts 
            // not preceded by an external resource.
            document.write(markup);
            document.close();
        });
    },

    // Kickstart processing. Guard against beginning before the document is ready.
    run: function(conf) {
        var prepareConf = function() {
            // Do NOT proceed unless we're ready.
            if (!/complete|loaded/.test(document.readyState)) {
                return setTimeout(prepareConf, 15);
            }
            Mobify.transform.prepareConf(conf);
        };

        prepareConf();
    }
});

})(document, Mobify.$, Mobify);

Mobify.timing.addPoint('Walked Mobify.js');
/**
 * Mobify.js API to the Mobify Image Resizing Service.
 */
(function(window, Mobify, Math) {

var $ = Mobify.$

  , absolutify = document.createElement('a')

    // A regex for detecting http(s) URLs.
  , httpRe = /^https?/

    /**
     * Returns a URL suitable for use with the 'ir' service.
     */
  , getImageURL = Mobify.getImageURL = function(url, options) {
        options = options || {}

        var bits = [defaults.host];

        if (defaults.projectName) {
            bits.push("project-" + defaults.projectName);
        }

        if (options.cacheHours) {
            bits.push('c' + options.cacheHours);
        }

        if (options.format) {
            bits.push(options.format + (options.quality || ''));
        }

        if (options.maxWidth) {
            bits.push(options.maxWidth);

            if (options.maxHeight) {
                bits.push(options.maxHeight);
            }
        }

        bits.push(url);
        return bits.join('/');
    }

    /**
     * Searches the collection for image elements and modifies them to use
     * the Image Resize service. Pass `options` to modify how the images are
     * resized. Returns the collection of images that were modified.
     */
  , resizeImages = $.fn.resizeImages = function(options) {
        var opts = $.extend({}, defaults, typeof options == 'object' && options)
          , dpr = window.devicePixelRatio
          , $imgs = this.filter(opts.selector).add(this.find(opts.selector))
          , attr;

        if (typeof options == 'number') {
            opts.maxWidth = Math.floor(options);
        }

        if (dpr) {
            if (opts.maxWidth) {
                opts.maxWidth = Math.ceil(opts.maxWidth * dpr);
            }

            if (opts.maxHeight) {
                opts.maxHeight = Math.ceil(opts.maxHeight * dpr);
            }
        }

        return $imgs.filter(function() {
            if (attr = this.getAttribute(opts.attribute)) {
                absolutify.href = attr;
                var url = absolutify.href;
                if (httpRe.test(url)) {
                    this.setAttribute('x-src', getImageURL(url, opts));
                    return true
                }
            }
        });
    }

  , defaults = resizeImages.defaults = {
        host: '//ir0.mobify.com'
      , selector: 'img[x-src]'
      , attribute: 'x-src'
      , projectName: Mobify.config.projectName || ''
    }

})(this, Mobify, Math);



/**
 * Exposes the `Mobify.urlmatch`.
 */
(function() {

/**
 * Returns an escaped string that when passed to the regular expression
 * contructor will match the literal contents of the string.
 */
var reEscape = function (str) {
    return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};

var declareUrlMatch = function(window, Mobify) {

    /**
     * Given a a path expression `expr`, returns a RegExp that can be
     * used to match a URL's path.
     */
    var getExpressionRegExp = function(expr) {
        if (expr == "/*") {
            return /.*/;
        }

        // #    Expr    Split               RE
        // A    /       [""]                /^\/+$/
        // B    /*/     ["", "*", ""]       /^\/+[^\/]+\/*$/
        // C    /a/     ["", "a", ""]       /^\/+a\/*$/
        // D    /a      ["", "a"]           /^\/+a\/*$/
        // E    /a/*    ["", "a", "*"]      /^\/+a\/+.+$/
        // F    /a/b    ["", "a", "b"]      /^\/+a\/+b\/*$/
        // G    /a/b/   ["", "a", "b", ""]  /^\/+a\/+b\/*$/
        // H    /a/b/*  ["", "a", "b", "*"] /^\/+a\/+b\/+.+$/

        var EMPTY = "";
        var WILD = "*";
        // Merge slashes.
        var SLASH = "\\/+";

        var bits = expr.slice(1).split("/");
        var reStr = EMPTY;
        var bit;

        while (bits.length) {
            bit = bits.shift();
            if (bits.length) {
                reStr += SLASH + ((bit == WILD) ? "[^\\/]+" : reEscape(bit));
            } else {
                // E
                if (bit == WILD) {
                    reStr += ".+"
                } else {
                    // D
                    if (bit != EMPTY) {
                        reStr += SLASH + reEscape(bit)
                    }
                    reStr += '\\/*';
                }
            }
        }

        var re = RegExp("^" + reStr + "$", "i");
        return re
    };

    /**
     * Given a path expression `expr`, or a regular expression, returns a
     * function that can be used to match against the current window's path,
     * `window.location.pathname`.
     */
    var urlmatch = function(expr) {
        var exprIsRegExp, exprIsString, re;

        exprIsRegExp = expr instanceof RegExp;
        exprIsString = (typeof expr === 'string');

        if (!(exprIsRegExp || exprIsString)) {
            return false;
        }
        if (exprIsRegExp) {
            re = expr;
        } else {
            re = getExpressionRegExp(expr);
        }
        return function() {
            // Note, window is the closed-overarguemnt to the parent function,
            // not necessarily the global window
            return re.test(window.location.pathname) ? expr : false;
        };
    };

    /**
     * Allow the local variable `window` to be overridden. Useful for testing.
     */
    urlmatch.setWindow = function (newWindow) {
        window = newWindow;
    };

    return urlmatch;
};

// Conditional loading using `define`, or adding to `Mobify`.
if ((typeof define !== "undefined" && define !== null) && 'function' === typeof define) {
    define([], function() {
        return declareUrlMatch;
    });
}
if ((typeof Mobify !== "undefined" && Mobify !== null) && 'object' === typeof Mobify &&
  Mobify.urlmatch === undefined) {
    Mobify.urlmatch = declareUrlMatch(window, Mobify);
}

})();


    (function(){dust.register("base_root",body_0);function body_0(chk,ctx){return chk.reference(ctx.get("doctype"),ctx,"h",["s"]).reference(ctx.get("$html"),ctx,"h",["openTag","s"]).reference(ctx.get("$head"),ctx,"h",["openTag","s"]).block(ctx.getBlock("baseScripts"),ctx,{"block":body_1},null).block(ctx.getBlock("head"),ctx,{"block":body_3},null).write("</head>").reference(ctx.get("$body"),ctx,"h",["openTag","s"]).block(ctx.getBlock("body"),ctx,{"block":body_4},null).block(ctx.getBlock("scripts"),ctx,{"block":body_6},null).write("</body></html>");}function body_1(chk,ctx){return chk.section(ctx.get("lib_import"),ctx,{},null).write("<script>Mobify.enhance(),Mobify.$(this).bind(\"load\",function(){location.hash||setTimeout(function(){pageYOffset||scrollTo(0,1)},250)})</script>").write("<script>").write("\n            Mobify.$('html').addClass(\"").section(ctx.getAscendablePath(false,["content","templateName"]),ctx,{"block":body_2},null).write("\");\n        ").write("</script>").write("    ");}function body_2(chk,ctx){return chk.write("x-").reference(ctx.getAscendablePath(true,[]),ctx,"h").write(" ");}function body_3(chk,ctx){return chk.reference(ctx.get("$head"),ctx,"h",["innerHTML","s"]).write("<link rel=\"stylesheet\" href=\"").reference(ctx.getAscendablePath(false,["config","configDir"]),ctx,"h").write("style.css\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no\" />");}function body_4(chk,ctx){return chk.partial("_header",ctx).block(ctx.getBlock("content"),ctx,{"block":body_5},null).partial("_footer",ctx);}function body_5(chk,ctx){return chk.reference(ctx.get("$body"),ctx,"h",["innerHTML","s"]);}function body_6(chk,ctx){return chk;}return body_0;})();
(function(){dust.register("base_scripts",body_0);function body_0(chk,ctx){return chk.write("<script src=\"").reference(ctx.getAscendablePath(false,["config","configDir"]),ctx,"h").write("a.js\"></script>").write("<script>Mobify.$(function(){if(!Mobify.evaluatedCont)return;var e=Mobify.evaluatedCont.root.warnings||{},t=Mobify.$.map(e,function(e,t){return t}).join(\" \");t&&Mobify.$(\'<div id=\"x-mobify-warnings\" style=\"display: none\">\').text(t).appendTo(document.body)})</script>");}return body_0;})();
(function(){dust.register("legacy_root",body_0);function body_0(chk,ctx){return chk.reference(ctx.get("doctype"),ctx,"h",["s"]).reference(ctx.get("$html"),ctx,"h",["openTag","s"]).reference(ctx.get("$head"),ctx,"h",["openTag","s"]).block(ctx.getBlock("baseScripts"),ctx,{"block":body_1},null).block(ctx.getBlock("head"),ctx,{"block":body_2},null).write("</head>").reference(ctx.get("$body"),ctx,"h",["openTag","s"]).block(ctx.getBlock("body"),ctx,{"block":body_3},null).block(ctx.getBlock("scripts"),ctx,{"block":body_8},null).write("</body></html>");}function body_1(chk,ctx){return chk.section(ctx.get("lib_import"),ctx,{},null).write("<script>Mobify.enhance(),Mobify.$(this).bind(\"load\",function(){location.hash||setTimeout(function(){pageYOffset||scrollTo(0,1)},250)})</script>");}function body_2(chk,ctx){return chk.reference(ctx.get("$head"),ctx,"h",["innerHTML","s"]).write("<link rel=\"stylesheet\" href=\"").reference(ctx.getAscendablePath(false,["config","configDir"]),ctx,"h").write("style.css\" /><meta name=\"viewport\" content=\"width=device-width; initial-scale=1.0; minimum-scale=1.0; maximum-scale=1.0; user-scalable=no;\" />");}function body_3(chk,ctx){return chk.write("<section id=\"x-root\" class=\"").section(ctx.getAscendablePath(false,["content","templateName"]),ctx,{"block":body_4},null).write("\">").block(ctx.getBlock("header"),ctx,{"block":body_5},null).write("<section id=\"x-main\">").block(ctx.getBlock("content"),ctx,{"block":body_6},null).write("</section>").block(ctx.getBlock("footer"),ctx,{"block":body_7},null).write("</section>");}function body_4(chk,ctx){return chk.write("x-").reference(ctx.getAscendablePath(true,[]),ctx,"h").write(" ");}function body_5(chk,ctx){return chk.partial("_header",ctx);}function body_6(chk,ctx){return chk.reference(ctx.get("$body"),ctx,"h",["innerHTML","s"]);}function body_7(chk,ctx){return chk.partial("_footer",ctx);}function body_8(chk,ctx){return chk;}return body_0;})();

    (function(){dust.register("_footer",body_0);function body_0(chk,ctx){return chk;}return body_0;})();
(function(){dust.register("_header",body_0);function body_0(chk,ctx){return chk.write("<header><div class=\"title\"><h1>Welcome to your first Mobify.js Mobile Page</h1><h2>As an initial example of content selection, we've selected the title of your site and placed it in _header.tmpl:</h2><p class=\"extract\">").reference(ctx.getAscendablePath(false,["header","title"]),ctx,"h").write("</p></div></header>");}return body_0;})();
(function(){dust.register("base",body_0);function body_0(chk,ctx){return chk.reference(ctx.get("doctype"),ctx,"h",["s"]).reference(ctx.get("$html"),ctx,"h",["openTag","s"]).reference(ctx.get("$head"),ctx,"h",["openTag","s"]).block(ctx.getBlock("baseScripts"),ctx,{"block":body_1},null).block(ctx.getBlock("head"),ctx,{"block":body_3},null).write("</head>").reference(ctx.get("$body"),ctx,"h",["openTag","s"]).block(ctx.getBlock("body"),ctx,{"block":body_4},null).block(ctx.getBlock("scripts"),ctx,{"block":body_6},null).write("</body></html>");}function body_1(chk,ctx){return chk.section(ctx.get("lib_import"),ctx,{},null).write("<script>Mobify.enhance(),Mobify.$(this).bind(\"load\",function(){location.hash||setTimeout(function(){pageYOffset||scrollTo(0,1)},250)})</script>").write("<script>").write("\n            Mobify.$('html').addClass(\"").section(ctx.getAscendablePath(false,["content","templateName"]),ctx,{"block":body_2},null).write("\");\n        ").write("</script>").write("    ");}function body_2(chk,ctx){return chk.write("x-").reference(ctx.getAscendablePath(true,[]),ctx,"h").write(" ");}function body_3(chk,ctx){return chk.reference(ctx.get("$head"),ctx,"h",["innerHTML","s"]).write("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no\" />");}function body_4(chk,ctx){return chk.partial("_header",ctx).block(ctx.getBlock("content"),ctx,{"block":body_5},null).partial("_footer",ctx);}function body_5(chk,ctx){return chk.reference(ctx.get("$body"),ctx,"h",["innerHTML","s"]);}function body_6(chk,ctx){return chk;}return body_0;})();
(function(){dust.register("home",body_0);var blocks={content:body_1};function body_0(chk,ctx){ctx=ctx.shiftBlocks(blocks);return chk.partial("base",ctx);}function body_1(chk,ctx){ctx=ctx.shiftBlocks(blocks);return chk.write("<h2>We've also extracted the first paragraph from your site and placed it in home.tmpl:</h2><p class=\"extract\">").reference(ctx.getAscendablePath(false,["content","firstp"]),ctx,"h").write("</p>");}return body_0;})();




Mobify.transform.run(function() {
    var $ = this.$, M = this;
    return { data: $.extend(
        
/* Default configuration. Override these settings in your site-specific conf */
{
    '?unmobify':  false,
    
    mobileViewport: 'width=device-width; initial-scale=1.0; minimum-scale=1.0; maximum-scale=1.0; user-scalable=no;',
    
    // 'example.png'
    touchIcon: undefined,
    
    formatDetection: ["telephone=no", "address=no"],
    
    cssDir: function(cont) { 
        return cont.data('config.configDir') 
    },

    imageDir: function(cont) {
        return cont.data('config.configDir') + 'i/' 
    },

    '?HD' : function(cont) { 
        return cont.data('config.HD') 
    },
    
    // Populated from `site.json`.
    siteConfig: {},
    
    // Timestamp when this string was made.
    buildDate: 1389045284357,
    
    // JB: Update this property to work with new builds.
    configName: '',
    
    cssName: function(cont) { 
        return cont.data('configName').split('/').pop().split('.')[0] || 'stylesheet'; 
    }
}
,
         {
// Important: Change nothing above this point
// -------------------------------------

// Extract title for use in _header.tmpl
'header': {
    'title': function() {
        return $('title').text();
    }
},

// Extract page content, which is different depending on the page being rendered
'content': function(context) {
    return context.choose(
    {
        'templateName': 'home'
      , '!firstp': function() {
            return $('p').first().text() || "Could not find the first paragraph text in your page";
        }
    }
    /*  // An example of another template object. Uncomment this block and change
        // your selectors to be unique to the DOM for the template you want to use
    ,{ 
        'templateName': 'about'
      , '!phonenumber': function() {
            return $('.selector_for_phone_number');
        }
      , '!blurb': function() {
            return $('.selector_for_blurb');
        }
    }*/
    )
},

// Remove all desktop site scripts (optional)
'script': function() {
    return $('script').remove();
},

// Remove all desktop site stylesheets (optional)
'stylesheet': function() {
    return $('link[rel="stylesheet"]').remove(); 
},

// -------------------------------------
// Important: Change nothing after this point unless you know what you are doing :)
'OUTPUTHTML': function(context) {
    var templateName = context.data('content.templateName');
    if (templateName) {
        return context.tmpl(templateName);
    }
}

} 
    )}
});


// Version control tag, use an array with version numbers.  Examples:
// V 1.1: [1,1].  V1.2.3: [1,2,3]

Mobify.api = [1,1];



