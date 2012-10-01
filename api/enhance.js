// Polyfills the `orientationchange` event.
// Exposes Touch, OS, HD and Orientation properties on `Mobify.config`.
// x-desktop, x-ios, x-android, x-blackberry, x-webos, x-nokia
// x-notouch, x-touch
// x-landscape, x-portrait
// x-sd, x-hd x-hd15 x-hd20
//
// TODO: Windows Phone
// http://windowsteamblog.com/windows_phone/b/wpdev/archive/2011/03/22/targeting-mobile-optimized-css-at-windows-phone-7.aspx
define(["./mobifyjs", "./phoenix", "./orientation"], function(Mobify, phoenix) {

var $ = Mobify.$;
if (!$) return;

phoenix.register('enhance');

// ###
// # Device Properties
// ###

var $test = $('<div>', {id: 'mc-test'})
  , style = $test[0].style

    // Touch:
  , touch = 'ontouchend' in document

    // OS: ios, android, nokia, blackberry, webos, desktop
  , osMatch = /(ip(od|ad|hone)|android|nokia|blackberry|webos)/gi.exec(navigator.userAgent)
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
return Mobify.enhance = function() {
    
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

});
