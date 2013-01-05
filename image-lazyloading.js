define([], function() { 

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

  , processScroll = Lazyload.processScroll = function() {
        var images = document.getElementsByTagName("img");
        for (var i=0; i<images.length; i++) {
            if (elementInViewport(images[0])) {
                images[0].setAttribute("src", images[0].getAttribute("data-src"));
            }
        }
    }

  , rewriteSrc = Lazyload.rewriteSrc = function(document) {
        var images = document.getElementsByTagName("img");
        for (var i=0; i<images.length; i++) {
            var src = images[i].getAttribute("x-src");
            images[i].removeAttribute("x-src");
            images[i].setAttribute("data-src", src);
        }
    }

return Lazyload;

});