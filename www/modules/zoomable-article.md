# Building a mobile image zooming module

Today, most 'zoom in a photo' controls are designed for devices with a mouse or touchpad. Typically, they show zoomed in section of an image as a pointer is hovered over different parts of thumbnail. This behavior does not work on mobile devices that have no concept of hover ([example](http://www.511tactical.com/All-Products/Pants/Tactical-Pants/Taclite-Pro-Pants.html)). In addition, desktop-first zoom controls often try to share screen space between thumbnail and full size image, which is less desirable on small screen devices.

To correct these mobile-specific issues, we move away from typical desktop zoomer design decisions. The control relies on dragging to pan around the image, and magnified view defaults to taking over the entire viewport. 

## Basic use

    <script src="zepto.js"></script>
    <script src="zoomable.js"></script>
    <a class="zoomable" href="big.jpg">
        <img src="thumbnail.jpg">
    </a>
    <script>$('a.m-zoomable').zoomable()</script>

We start with a basic link to a high resolution image, and include its thumbnail inside the link. If zoomable widget fails or is intentionally disabled, link would be clickable and would still provide an acceptable interface for panning through and zooming the large image (although outside current page).

When zoomable initializes, it attaches a click handler to the link. When the click comes in, zoomable will render an `overflow: auto` wrapper with scaled up image inside.

## Details

The above-described behavior is actually slightly more complicated. The full resolution image may take a while to load. So, we assume that thumbnail and full resolution image are differently scaled versions of each other, and stack the stretched thumbnail underneath full resolution image. As a result, the user will be able to see the image closer (but blurrier) while higher resolution variant loads, and additional detail will become visible as load completes.

Second enhancement involves initial position of zoomable view. If zoomable was entered by clicking the thumbnail (rather than some kind of separate 'Zoom In' text), we can identify position of the click relative to thumbnail boundaries, and focus the corresponding part of image in magnified view. For example, clicking bottom centre of the thumbnail will start the user at bottom centre of the zoomed in view.

## Limitations

### Click event

Zoomable relies on click event for activation and deactivation. This results 
in about ~300ms delay in iOS, as Mobile Safari waits to ensure that event 
in question is a single tap rather than built-in page zooming double tap. 
We do not bundle a quick tap implementation with zoomable, but you can 
attach a tap event manually. Here is an example of custom binding that 
uses [jQuery tappable](https://github.com/aanand/jquery.tappable.js/blob/master/jquery.tappable.js):

    var el = $('a.zoomable').zoomable();
    el.tappable(function() {
        $(this).zoomable('show');
    });
	
Other quick touch implementations can be used in similar ways.