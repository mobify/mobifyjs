var capturing = window.capturing || false;

// Picture Polyfill adjusted to use capturing
// https://github.com/jansepar/picturefill
/*! Picturefill - Author: Scott Jehl, 2012 | License: MIT/GPLv2 */
var polyfillPictureElement=function(a,b,c){"use strict";var e,d=!1||a.localStorage&&"true"===a.localStorage["picturefill-prefHD"],f=!1;a.document.createElement("picture")&&a.document.createElement("source")&&a.HTMLPictureElement&&(f=!0),a.types={},a.picturedetect=function(){return function(){if(!f){var c={svg:"http://www.w3.org/2000/svg"},d=b.createElement("div");d.innerHTML="<svg/>",(d.firstChild&&d.firstChild.namespaceURI)==c.svg&&(a.types["image/svg+xml"]=!0);var e=new Image;e.onload=function(){1==e.width&&(a.types["image/webp"]=!0)},e.src="data:image/webp;base64,UklGRiwAAABXRUJQVlA4ICAAAAAUAgCdASoBAAEAL/3+/3+CAB/AAAFzrNsAAP5QAAAAAA=="}}}(),a.picturefill=function(){return function(){if(!f)for(var g=b.getElementsByTagName("picture"),h=0,i=g.length;i>h;h++){var m,j=g[h].getElementsByTagName("source"),k=null,l=[];if(!j.length){var n=g[h].innerHTML,o=b.createElement("div"),p=n.replace(/(<)source([^>]+>)/gim,"$1div$2").match(/<div[^>]+>/gim);o.innerHTML=p.join(""),j=o.getElementsByTagName("div")}for(var q=0,r=j.length;r>q;q++){var s=j[q].getAttribute("media"),t=j[q].getAttribute("type");if(l.length&&t!=m)break;t&&1!=a.types[t]||(!s||a.matchMedia&&a.matchMedia(s).matches)&&l.push(j[q]),m=t}var k=g[h].getElementsByTagName("img")[0];if(c&&(k.setAttribute("data-src",k.getAttribute(c+"src")),k.removeAttribute(c+"src")),l.length){var u=l.pop(),v=u.getAttribute("srcset");if(k||(k=b.createElement("img"),k.alt=g[h].getAttribute("alt"),g[h].appendChild(k)),v){var w=d&&a.devicePixelRatio||1,j=v.split(",");e=a.devicePixelRatio>1;for(var x=j.length,y=x-1;y>=0;y--){var z=j[y].replace(/^\s*/,"").replace(/\s*$/,"").split(" "),A=parseFloat(z[1],10);if(w>=A){if(k.getAttribute("src")!==z[0]){var B=b.createElement("img");B.src=z[0],B.alt=k.alt,B.onload=function(){this.width=this.cloneNode(!0).width/A},k.parentNode.replaceChild(B,k)}break}}}else{var C=u.getAttribute("src");k.src?-1==k.src.indexOf(C)&&(k.src=C):k.src=C}}else k&&g[h].removeChild(k)}}}(),window.capturing?(a.picturedetect(),a.picturefill()):a.addEventListener("resize",a.picturefill,!1)};

if (capturing) {
    console.log("Executing main during capturing phase!")

    // Grab reference to a newly created document
    var capture = Mobify.Capture.init();
    var capturedDoc = capture.capturedDoc;
    // Execute polyfill on captured document
    polyfillPictureElement(window, capturedDoc, capture.prefix);
    
    // Render source DOM to document
    capture.renderCapturedDoc();

} else {
    console.log("Executing main in post-capturing phase!");
    // Execute polyfill on document
    polyfillPictureElement(window, document);
}
