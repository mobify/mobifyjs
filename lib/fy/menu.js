// TODO: ALLOW DYNAMIC BINDING w/ href attributes
// TODO: Resize on rotation
// TODO: Bind correct touch / click events
(function(Mobify) {
  var $ = Mobify.$;

  Mobify.menu = function(opts) {
    opts = opts || {};
    
    var $menu = $(opts.menu || '#mobify-menu');
    var $bg = $(opts.bg || '#mobify-menu-bg');
    var $html = $(document.documentElement);
    
    var menuOnClass = opts.menuClass || 'on';
    var htmlOnClass = opts.htmlClass || 'x-menu-on';
    
    // Don't let menu clicks bubble up to the document listener.
    $menu.bind($.support.events.down, function(e) {
        if (!isOpen()) return open(e);
        var el = getEventTarget(e.target);
        if (el.id == 'mobify-menu-toggle' || el.className == 'mobify-menu-close') return close(e);
      e.stopPropagation();
    });
    
    // Clicking in document while menu is on turns it off.
    $html.bind($.support.events.down, function(e) {
        if (isOpen()) return close(e);
    });
    
    $(window).bind('orientationchange', fill);
    
    function fill() {
        $bg.css('height', $html.height() + 'px');
    }
    
    function isOpen() {
        return $menu.hasClass(menuOnClass);
    }
    
    function open(e) {
        $menu.addClass(menuOnClass);
        $html.addClass(htmlOnClass);
        fill();
        return stop(e);
    }
    
    function close(e) {
        $menu.removeClass(menuOnClass);
        $html.removeClass(htmlOnClass);
        return stop(e);
    }

    function stop(e) {
        e.stopPropagation();
        e.preventDefault();
        return false; 
    }
    
    // TouchEvents fire on TextNodes, change the target to the parent.
    function getEventTarget(el) {
        return el.nodeType == 3 ? el.parentNode : el;
    }
  };
})(Mobify);