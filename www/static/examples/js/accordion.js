var Mobify = window.Mobify = window.Mobify || {}; 
Mobify.$ = Mobify.$ || window.Zepto || window.jQuery;
Mobify.UI = Mobify.UI || {};

Mobify.UI.Accordion = (function($) {
   
    // Constructor
    var Accordion = function(element) {
        this.element = element;
        this.$element = $(element);
        this.bind();            
    };

    Accordion.prototype.bind = function() {
        var $element = this.$element;
        
        function close($item) {
            var content = $item.find('.content');
            $item.toggleClass('active');
            content.removeAttr('style');
        };
        
        function open($item) {
            var content = $item.find('.content');
            $item.toggleClass('active');
            content.css('height', content.height()+'px');
        };

        $element.find('.header').bind('click', function(e) {
            e.preventDefault();
            
            var $item = $(this).parent();

            if ($item.hasClass('active')) {
                close($item);
            }
            else {
                open($item);
            }
        });
        
        // Open items that are hash linked
        var hash = location.hash;
        var $hashitem = $element.find('.header a[href="'+hash+'"]');
  
        if ($hashitem.length) {
            open($hashitem.parent());
        }
        
    };
                 
    Accordion.prototype.unbind = function() {
        this.$element.off();      
    }
                 
    Accordion.prototype.destroy = function() {
        this.unbind();
        this.$element.remove();
        this.$element = null;
    }
    
    return Accordion;
    
})(Mobify.$);
    
(function($) {
    $.fn.accordion = function(action) {
        this.each(function () {
            var $this = $(this)
              , accordion = $this._accordion
        
            if (!accordion) {
                accordion = new Mobify.UI.Accordion(this);
            }   

            if (action) {
                accordion[action]();

                if (action === 'destroy') {
                    accordion = null;
                }   
            }   
        
            $this._accordion = accordion;
        })  

        return this;
    };
})(Mobify.$);
