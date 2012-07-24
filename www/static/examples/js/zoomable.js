(function() {

var Mobify = window.Mobify = window.Mobify || {}
  , $ = Mobify.$ = Mobify.$ || window.$ || window.Zepto || window.jQuery;

Mobify.UI = Mobify.UI || { classPrefix: 'm-' };

var $ = window.Mobify ? Mobify.$ : window.$;

Mobify.UI.Zoomable = (function() {
    var defaults = {
        classNames: {
            zooming : 'zooming'
          , close : 'close'
          , stage: 'zoomableStage'
          , canvas: 'zoomableCanvas'
          , thumb: 'zoomableThumb'
          , full: 'zoomableFull'
      }
      , global: true
      , ratio: 2.0
      , canvasStyle: {
          position: 'absolute'
        , width: '100%'
        , height: '100%'
        , overflow: 'auto'
      }
      , imageStyle: {
          position: 'absolute'
        , top: '0'
        , left: '0'
        , maxWidth: 'none'
        , maxHeight: 'none'        
      }
      , stage: function() {
            var $stage = $('#' + this._getClass('stage'));
            if (!$stage.length) {
                $stage = $('<div>').attr('id', this._getClass('stage'));
                
            }

            if (this.options.global || !$stage.parent().length) {
                this.$body.append($stage);
            }

            if (!$stage.html().trim().length) {
                $stage.html(
                    '<div class="' + this._getClass('canvas') + '"><img class="'
                  + this._getClass('thumb') + '"><img class="'
                  + this._getClass('full') + '"></div>');
            }

            return $stage;
      }
      , globalStyle: function() {
          return 'body.' + this._getClass('zooming') + ' { overflow: hidden; }'
              + 'body.' + this._getClass('zooming') +' > * { display: none !important; }'
              + 'body.' + this._getClass('zooming') +' > #' + this._getClass('stage') + ' { display: block !important; }';
      }
      , clickCloses: true
    };

    var Zoomable = function(element, options) {
        var self = this;

        this.options = $.extend({}, Zoomable.defaults, options);
        this.options.classNames = $.extend(defaults.classNames, this.options.classNames);
        this.options.imageStyle.width = 100 * this.options.ratio + '%';

        this.$body = $('body');
        this.$element = $(element);
        this.$stage = $(this.options.stage.call(this)).hide();
        this.$canvas = this.$stage.find('.' + this._getClass('canvas')).css(this.options.canvasStyle);
        this.$thumb = this.$stage.find('.' + this._getClass('thumb')).css(this.options.imageStyle);
        this.$full = this.$stage.find('.' + this._getClass('full')).css(this.options.imageStyle);

        if (this.options.clickCloses) this.$canvas.addClass(this._getClass('close'));

        if (this.options.global) {
            if (!$('style[data-zoomable="' + this._getClass('zooming') + '"]').length) {
                var style = document.createElement('style');
                style.innerHTML = this.options.globalStyle.call(this);
                $('head')[0].appendChild(style);
            }
        } else {
            this.$stage.css('position', 'relative');
        }

        this.bind();
    };

    Zoomable.defaults = defaults;

    Zoomable.prototype.unbind = function() {   
        return this.bind(true);
    };

    Zoomable.prototype.bind = function(undo) {
        var self = this;
        var op = undo ? 'unbind' : 'bind';

        this.closeFn = this.closeFn || $.proxy(function(ev) {
            if (!this.isOpen) return;
            this.isOpen = false;
            this.$body.removeClass(this._getClass('zooming'));
            this.$stage.removeClass(this._getClass('zooming'));

            if (this.global) {
                document.body.scrollTop = this.oldScrollTop;
            }
        }, this);

        this.openFn = this.openFn || $.proxy(function(ev) {
            ev.preventDefault();
            if (this.isOpen) return;

            this.isOpen = true;

            var leftRatio = 0.5, topRatio = 0.5, $img, src;
            if (ev.target.tagName !== "IMG") {
                var $parents = $(this).parents();
                for (var i = 0; i < $parents.length; ++i) {
                    $img = $($parents[i]).find('img');
                    if ($img.length) break;  
                }
            } else {
                $img = $(ev.target);
                leftRatio = ev.offsetX / $img.prop('offsetWidth');
                topRatio = ev.offsetY / $img.prop('offsetHeight');
            }

            src = $img.parent('[href]').attr('href') || $img.attr('src');
            this.$thumb.attr('src', $img.attr('src'));
            this.$full.attr('src', src);
            if (this.global) this.oldScrollTop = document.body.scrollTop;

            this.$body.addClass(this._getClass('zooming'));
            this.$stage.addClass(this._getClass('zooming'));


            var smallWidth = this.$canvas.prop('offsetWidth')
              , bigWidth = this.$thumb.prop('offsetWidth') - smallWidth
              , smallHeight = this.$canvas.prop('offsetHeight')
              , bigHeight = this.$thumb.prop('offsetHeight') - smallHeight;

            this.$canvas.prop('scrollLeft', Math.max(0, Math.min(bigWidth,
                (bigWidth + smallWidth) * leftRatio - smallWidth / 2)));
            this.$canvas.prop('scrollTop', Math.max(0, Math.min(bigHeight,
                (bigHeight + smallHeight) * topRatio - smallHeight / 2)));
        }, this)

        this.$element[op]('click', function(ev) { return self.openFn(ev)});
        this.$stage.find('.' + this._getClass('close'))[op]('click', function(ev) { return self.closeFn(ev)});
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
            }
        }
        
        $this.data(name, zoomable);
    });

    return this;    
};

})();