define(["mobifyjs/utils", "mobifyjs/capture"], function(Utils, Capture) {

var capturing = window.Mobify && window.Mobify.capturing || false;

if (capturing) {
    // Override renderCapturedDoc to disable img elements in picture elements
    var oldRenderCapturedDoc = Capture.prototype.renderCapturedDoc;
    Capture.prototype.renderCapturedDoc = function(options) {
        // Change attribute of any img element inside a picture element
        // so it does not load post-flood
        var imgsInPicture = this.capturedDoc.querySelectorAll('picture img, span[data-picture] img');
        for (var i = 0, len = imgsInPicture.length; i < len; i++) {
            var disableImg = imgsInPicture[i];
            var srcAttr = window.Mobify && window.Mobify.prefix + 'src';
            disableImg.setAttribute('data-orig-src', disableImg.getAttribute(srcAttr));
            disableImg.removeAttribute(srcAttr);
        }
        oldRenderCapturedDoc.apply(this, arguments);
    }

    return;
}

window.matchMedia = window.matchMedia || Utils.matchMedia(document);

/*! Picturefill - Responsive Images that work today. (and mimic the proposed Picture element with span elements). Author: Scott Jehl, Filament Group, 2012 | License: MIT/GPLv2 */

(function( w ){

    // Enable strict mode
    "use strict";

    // Test if `<picture>` is supported natively, if so, exit - no polyfill needed.
    if ( !!( w.document.createElement( "picture" ) && w.document.createElement( "source" ) && w.HTMLPictureElement ) ){
        return;
    }

    w.picturefill = function() {
        var ps = w.document.querySelectorAll( "picture, span[data-picture]" );
        // Loop the pictures
        for( var i = 0, il = ps.length; i < il; i++ ){
            var sources = ps[ i ].querySelectorAll( "span, source" ),
                matches = [];
            // If no sources are found, they're likely erased from the DOM. Try finding them inside comments.
            if( !sources.length ){
                var picText =  ps[ i ].innerHTML,
                    frag = w.document.createElement( "div" ),
                    // For IE9, convert the source elements to divs
                    srcs = picText.replace( /(<)source([^>]+>)/gmi, "$1div$2" ).match( /<div[^>]+>/gmi );

                frag.innerHTML = srcs.join( "" );
                sources = frag.getElementsByTagName( "div" );
            }

            // See if which sources match
            for( var j = 0, jl = sources.length; j < jl; j++ ){
                var media = sources[ j ].getAttribute( "data-media" ) || sources[ j ].getAttribute( "media" );
                // if there's no media specified, OR w.matchMedia is supported 
                if( !media || ( w.matchMedia && w.matchMedia( media ).matches ) ){
                    matches.push( sources[ j ] );
                }
            }

            // Find any existing img element in the picture element
            var picImg = ps[ i ].getElementsByTagName( "img" )[ 0 ];

            if( matches.length ){
                var matchedEl = matches.pop();
                if( !picImg || picImg.parentNode.nodeName === "NOSCRIPT" ){
                    picImg = w.document.createElement( "img" );
                    picImg.alt = ps[ i ].getAttribute( "data-alt" );
                }
                else if( matchedEl === picImg.parentNode ){
                    // Skip further actions if the correct image is already in place
                    continue;
                }

                picImg.src = matchedEl.getAttribute( "data-src" ) || matchedEl.getAttribute("src");
                matchedEl.appendChild( picImg );
                picImg.removeAttribute("width");
                picImg.removeAttribute("height");
            }
            else if( picImg ){
                picImg.parentNode.removeChild( picImg );
            }
        }
    };

    // Run on resize and domready (w.load as a fallback)
    if( w.addEventListener ){
        w.addEventListener( "resize", w.picturefill, false );
        w.addEventListener( "DOMContentLoaded", function(){
            w.picturefill();
            // Run once only
            w.removeEventListener( "load", w.picturefill, false );
        }, false );
        w.addEventListener( "load", w.picturefill, false );
    }
    else if( w.attachEvent ){
        w.attachEvent( "onload", w.picturefill );
    }

}( this ));

return;

});
