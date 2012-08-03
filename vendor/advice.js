/*globals define*/

/*
**
** Copyright Martin Angers 2012, the MIT License
**
** Based on Twitter's presentation:
** https://speakerdeck.com/u/anguscroll/p/how-we-learned-to-stop-worrying-and-love-javascript
**
** And this gist by Angus Croll
** https://gist.github.com/2864853
**
** Usage:
** var withAdvice = require('./advice')
** withAdvice.call(targetObject)
**
** ...then...
** targetObject.before('someMethod', function() {
**   // Something to do before someMethod
** })
**
** ...and finally...
** targetObject.someMethod() // Calls the method inserted using `before`, then `someMethod()`
*/
;(function(global) {

  "use strict";

  // Define the bind method (the AngularJS' bind implementation is used, see:
  // https://github.com/angular/angular.js/blob/master/src/Angular.js#L664 )
  function bindFn(self, fn) {
    var slice = Array.prototype.slice,
      curryArgs = arguments.length > 2 ? slice(arguments, 2) : []

    if (typeof fn == 'function' && !(fn instanceof RegExp)) {
      return curryArgs.length ? function() {
            return arguments.length ?
              fn.apply(self, curryArgs.concat(slice.call(arguments, 0))) :
              fn.apply(self, curryArgs)
          }
        : function() {
            return arguments.length ?
              fn.apply(self, arguments) :
              fn.call(self)
          }
    } else {
      // in IE, native methods are not functions so they cannot be bound (note: they don't need to be)
      return fn
    }
  }

  // fn is a supporting object that implements around, before, after, hijackBefore and hijackAfter
  var fn = {
    around: function(base, wrapped) {
      return function() {
        var args = Array.prototype.slice.call(arguments)

        // Around calls the new method, passing the original method as the first argument.
        // It is up to the new method to decide when to call the original.
        return wrapped.apply(this, [bindFn(this, base)].concat(args))
      }
    },
    before: function(base, before) {
      // Before uses "around" and calls the original method AFTER the new method, returning
      // the result of the original method.
      return fn.around(base, function() {
        var args = Array.prototype.slice.call(arguments),
          orig = args.shift()

        before.apply(this, args)
        return (orig).apply(this, args)
      })
    },
    after: function(base, after) {
      // After uses "around" and calls the original method BEFORE the new method, returning
      // the result of the original method.
      return fn.around(base, function() {
        var args = Array.prototype.slice.call(arguments),
          orig = args.shift(),
          res = orig.apply(this, args)

        after.apply(this, args)
        return res
      })
    },
    hijackBefore: function(base, hijack, firstArgIsError) {
      // Hijcak before calls the hijack method, intercepts the callback, and calls the
      // base method. It basically chains the methods in this order: hijack->base->originalCb.
      // If the hijack method returns an error as first argument, the base method is skipped
      // and the error is sent to the original callback.
      return function() {
        var args = Array.prototype.slice.call(arguments),
          origCb = args.pop(),
          self = this

        hijack.apply(this, args.concat(function(er) {
          if (er && firstArgIsError) {
            origCb(er)
          } else {
            base.apply(self, args.concat(origCb))
          }
        }))
      }
    },
    hijackAfter: function(base, hijack, firstArgIsError) {
      // Hijcak after calls the base method, hijacks the callback parameter by passing a private method
      // as callback, then calls the hijack method with the arguments provided by the original, adding
      // the original callback as last argument. It basically chains the methods in this order:
      // base->privateCb->hijack->originalCb. If the base method returns an error as first argument, the
      // hijack method is skipped and the error is sent to the original callback.
      return function() {
        var args = Array.prototype.slice.call(arguments),
          origCb = args.pop(),
          res,
          self = this

        res = base.apply(this, args.concat(function(er) {
          if (er && firstArgIsError) {
            origCb(er)
          } else {
            // On callback, call the hijack method, passing the original callback as last argument
            hijack.apply(self, args.concat(origCb))
          }
        }))
        return res
      }
    }
  }

  // mixin augments target object with around, before and after methods
  // method is the base method, advice is the augmenting function
  var advice = function() {
    var mixins = ['before', 'after', 'around', 'hijackAfter', 'hijackBefore'],
      applyMixin = function(m) {
        this[m] = function(method, advice, argAsErr) {
          if (typeof this[method] === 'function') {
            return this[method] = fn[m](this[method], advice, argAsErr)
          } else {
            return this[method] = advice
          }
        }
      }

    // Avoid using forEach since it can be used in browser
    for (var i = 0; i < mixins.length; i++) {
      applyMixin.call(this, mixins[i])
    }
  }

  // Expose the version number
  advice.version = '0.1.0'

  // Module exports
  if (module && module.exports) {
    module.exports = advice
  } else {
    global['advice'] = advice
  }

  // AMD registration
  if (typeof define === 'function' && define.amd) {
    define('advice', function() {
      return advice
    })
  }

}(this))