var Mobify = window.Mobify = window.Mobify || {};
Mobify.$ = Mobify.$ || window.Zepto || window.jQuery;

// Requires Mobify object for method attachment
(function(Mobify){

// Private Methods

var elementInViewport = function(el) {
    var rect = el.getBoundingClientRect();
    return (
        rect.top  >= 0
    &&  rect.left >= 0
    &&  rect.top <= (window.innerHeight || document.documentElement.clientHeight)
    )   
};  

//Public Methods
var Lazyload = {}
  , renderImages = Lazyload.renderImages = function() {
        images = document.getElementsByTagName("img");
        for (var i=0; i<images.length; i++) {
            if (elementInViewport(images[i]) && images[i].hasAttribute("data-src")) {
                images[i].setAttribute("src", images[i].getAttribute("data-src"));
            }
        }
    }

  , rewriteSrc = Lazyload.rewriteSrc = function(document) {
        images = document.getElementsByTagName("img");
        for (var i=0; i<images.length; i++) {
            var src = images[i].getAttribute("x-src");
            images[i].removeAttribute("x-src");
            images[i].setAttribute("data-src", src);
        }
    }
  , attachLazyloadEvents = Lazyload.attachLazyloadEvents = function($document, captured) {
        document.addEventListener("DOMContentLoaded", function() { renderImages(); $(window).on("scroll", renderImages )}, false );
  }

Mobify.Lazyload = Lazyload;

})(Mobify);