(function() {

var Mobify = window.Mobify = window.Mobify || {}
  , $ = Mobify.$ = Mobify.$ || window.$ || window.Zepto || window.jQuery;

// This prefix is inserted before all class references for conflict avoidance.
// For example, default close class will be m-close. You can override this 
// property globally by setting it on Mobify.UI object. You can also override 
// it per-invocation by passing an alternate value inside options object:
// $('...').zoomable({classPrefix: 'qb-'})
Mobify.UI = Mobify.UI || { classPrefix: 'm-' };

var $ = window.Mobify ? Mobify.$ : window.$;

Mobify.UI.Zoomable = (function() {
    var defaults = {
            // Element inside which zoomed in content should be rendered. 
            // Defaults to the document body.
            stage: undefined
            // Look for (or generate) elements with these class names.
          , classNames: {
                zooming : 'zooming'
              , close : 'close'
              , control: 'zoomableControl'
              , canvas: 'zoomableCanvas'
              , thumb: 'zoomableThumb'
              , full: 'zoomableFull'
          }
            // Viewport width is multiplied by this value to determine zoomed in width.
          , ratio: 2.0
            // Ascend DOM level from trigger element to find nearest image to use 
            // as thumbnail. If set to false, no ascent would take place, and only 
            // images within initial context will be considered.
          , seekImage: true
            // Whether clicking anywhere on zoomed in image will stop zooming.
          , clickCloses: true
            // Override to use alternate event for all zoomable control interactions.
          , activationEvent: 'click'
            // Default style applied to canvas. Overriding replaces the whole object.
          , canvasStyle: {
                position: 'absolute'
              , width: '100%'
              , height: '100%'
              , overflow: 'auto'
          }
            // Default style applied to images within canvas. Overriding replaces the whole object.
          , imageStyle: {
                position: 'absolute'
              , top: '0'
              , left: '0'
              , maxWidth: 'none'
              , maxHeight: 'none'        
          }
            // Generator for HTML of zoomed in view. If overriding, you can call 
            // the old function via Mobify.UI.Zoomable.defaults.stageHTML.call(this)
          , stageHTML: function() {
                return '<div class="' + this._getClass('canvas') + '"><img class="'
                    + this._getClass('thumb') + '"><img class="'
                    + this._getClass('full') + '"></div>';
          }
            // Generator for global CSS (ignored if zoomable content injected into 
            // non-body element). If overriding, you can call old function via 
            // Mobify.UI.Zoomable.defaults.globalStyle.call(this)
          , globalStyle: function() {
                var zooming = '.' + this._getClass('zooming');
                return zooming + ' { overflow: hidden; }'
                  + zooming + ' > * { display: none !important; }'
                  + zooming + ' > .' + this._getClass('control') + ' { display: block !important; }';
            }
        }

        // stage: where the thing is inserted
        // element: the zoomable

      , Zoomable = function(element, options) {
            this.options = $.extend({}, Zoomable.defaults, options);
            this.options.classNames = $.extend(defaults.classNames, this.options.classNames);
            this.options.imageStyle.width = 100 * this.options.ratio + '%';

            // If no stage was proivded, use the body.
            if (!this.options.stage) {
                this.options.stage = $('body');
                this.options.global = true;
            }

            this.$element = $(element);
            this.bind();
        };

    Zoomable.defaults = defaults;

    Zoomable.prototype.unbind = function() {   
        return this.bind(true);
    };

    /**
     * Construct the elements for the module.
     *
     */
    Zoomable.prototype.makeElems = function() {
        this.$stage = this.options.stage;
        this.$canvas = $(this.options.stageHTML.call(this)).addClass(this._getClass('control'));
        this.$canvas.first().css(this.options.canvasStyle);

        this.$thumb = this.$canvas.find('.' + this._getClass('thumb')).css(this.options.imageStyle);
        this.$full = this.$canvas.find('.' + this._getClass('full')).css(this.options.imageStyle);

        if (this.options.clickCloses) {
            this.$canvas.first().addClass(this._getClass('close'));
        }

        if (this.options.global) {
            if (!$('style[data-zoomable="' + this._getClass('zooming') + '"]').length) {
                
                var style = document.createElement('style')
                  , css = this.options.globalStyle.call(this);

                // Yes, we really need to do this for IE8.
                style.setAttribute('type', 'text/css');

                if (style.styleSheet) {
                    style.styleSheet.cssText = css
                } else {
                    style.appendChild(document.createTextNode(css));
                }

                $('head')[0].appendChild(style);
            }
        } else {
            this.$stage.css('position', 'relative');
        }

        var closeSelector = '.' + this._getClass('close');
        this.$close = this.$canvas.find(closeSelector).add(this.$canvas.filter(closeSelector));
        this.bindClose('bind');
    }

    Zoomable.prototype.close = function(ev) {
        if (!this.isOpen) return;
        this.isOpen = false;

        this.$element.trigger('closing.zoomable');

        this.$canvas.detach();
        this.$stage.removeClass(this._getClass('zooming'));

        if (this.options.global) {
            document.body.scrollTop = this.oldScrollTop;
        }

        this.$element.trigger('close.zoomable');
    };

    Zoomable.prototype.open = function(event) {
        event.preventDefault();
        if (this.isOpen) return;
        this.isOpen = true;

        this.$element.trigger('opening.zoomable');

        if (!this.$stage) this.makeElems();

        var leftRatio = 0.5
          , topRatio = 0.5
          , $img = $(event.target)
          , $link
          , $parent
          , src;

        if (event.target.tagName !== "IMG") {
            var $parents = this.$element;
            if (this.options.seekImage) {
                $parents = $parents.add(this.$element.parents());
            }

            for (var i = 0; i < $parents.length; ++i) {
                $parent = $($parents[i]).find('img');
                if ($parent.length) {
                    $img = $parent;
                    break;  
                }
            }
        } else {
            leftRatio = event.offsetX / $img.prop('offsetWidth');
            topRatio = event.offsetY / $img.prop('offsetHeight');
        }

        $link = $img.filter('[href]').add($img.parent('[href]'));
        src = $link.attr('href') || $img.attr('src');
        this.$thumb.attr('src', $img.attr('src'));
        this.$full.attr('src', src);

        if (this.options.global) {
            this.oldScrollTop = document.body.scrollTop;
        }

        this.$stage.append(this.$canvas);
        this.$stage.addClass(this._getClass('zooming'));            

        var imgAspect = $img.prop('naturalHeight') / $img.prop('naturalWidth')
          , thumbWidth = this.$thumb.prop('offsetWidth')
          , smallWidth = this.$canvas.prop('offsetWidth')
          , bigWidth = thumbWidth
          , smallHeight = this.$canvas.prop('offsetHeight')
          , bigHeight = thumbWidth * imgAspect
          , thus = this;

        this.$thumb.one('load', function() {
            thus.$canvas.prop('scrollLeft', Math.max(0, Math.min(bigWidth - smallWidth,
                bigWidth * leftRatio - smallWidth / 2)));
            thus.$canvas.prop('scrollTop', Math.max(0, Math.min(bigHeight - smallHeight,
                bigHeight * topRatio - smallHeight / 2)));

            thus.$element.trigger('open.zoomable');                 
        })
    };

    Zoomable.prototype.bindClose = function(op) {
        if (this.$close) this.$close[op](this.options.activationEvent, this.boundClose);
    }

    Zoomable.prototype.bind = function(undo) {
        var self = this;
        var op = undo ? 'unbind' : 'bind';

        this.boundClose = this.boundClose || function(ev) { return self.close.apply(self, arguments); }
        this.boundOpen = this.boundOpen || function(ev) { return self.open.apply(self, arguments); }

        this.$element[op](this.options.activationEvent, this.boundOpen);

        this.bindClose(op);
    };

    Zoomable.prototype._getClass = function(id) {
        var classPrefix = this.options.classPrefix;
        if (typeof classPrefix === "undefined" ) classPrefix = Mobify.UI.classPrefix;
        
        return classPrefix + this.options.classNames[id];
    };    

    return Zoomable;
})();


$.fn.zoomable = function (action, options) {
    var name = 'Mobify.UI.Zoomable'
      , initOptions = $.extend({}, $.fn.zoomable.defaults);

    // Handle different calling conventions
    if (typeof action == 'object') {
        initOptions = action;
        options = null;
        action = null;
    } 

    this.each(function () {
        var $this = $(this)
          , zoomable = $this.data(name)
        
        if (!zoomable) {
            zoomable = new Mobify.UI.Zoomable(this, initOptions);
        }

        if (action) {
            zoomable[action](options);

            if (action === 'destroy') {
                $this.data(name, null);
                $this.$canvas.remove();
            }
        }
        
        $this.data(name, zoomable);
    });

    return this;    
};

})();