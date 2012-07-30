---
layout: modules
title: Mobify.js Zoomable Module
---

# Introducing Zoomable module

## Why is a new zoom widget required?

Current 'zoom in a photo' controls are designed for devices with a mouse or touchpad. Typically, they show zoomed in section of an image as a pointer is hovered over different parts of thumbnail. This behavior does not work on mobile devices that have no concept of hover ([example](http://www.511tactical.com/All-Products/Pants/Tactical-Pants/Taclite-Pro-Pants.html)). To solve this problem, we have implemented a zoom widget that relies on dragging to navigate through zoomed-in image.

## User interface

We start with a minimal user interface that contains only the source image, scaled up. If the user specifies a higher resolution version of the image, we attempt to render low resolution variant first and overlay it with high resolution one once it becomes available. 

User can navigate around by dragging the scaled up image, and leave zoomed in view by tapping the image. If user arrived at zoomed in view by clicking on image thumbnail, we would center their view on part of the image corresponding to tapped section. For example, tapping bottom left corner will start zoomable pointing at bottom left part of high resolution image.

Zoomable behavior can be extended by adding annotations/close buttons to zoomed in state. You can also disable tap-image-to-exit and image seeking behavior.

## Implementing Zoomable

The simplest implementation of zoomable looks like this:
	HTML: <a class="zoomable" href="big.jpg"><img src="thumb.jpg"></a>
	JS: $('a.zoomable').zoomable();

The link specifies URL of high resolution image, and image thumbnail (if present). If image is not found inside the link, zoomable will ascend DOM tree until it finds one nearby.

$.fn.zoomable() initialization call takes configuration parameters that are further described in next section. Alternatively, if your zoomable is already initialized, you can pass names of commands to execute:
	$('a.zoomable').zoomable("show");
	$('a.zoomable').zoomable("hide");
	$('a.zoomable').zoomable("destroy");


## Initialization parameters

Full parameter list is present in defaults variable, and is duplicated below:


	var defaults = {
        stage: undefined // Element inside which zoomed in content should be rendered. Defaults to document body.
      , classNames: { // Look for (or generate) elements with these class names.
            zooming : 'zooming'
          , close : 'close'
          , control: 'zoomableControl'
          , canvas: 'zoomableCanvas'
          , thumb: 'zoomableThumb'
          , full: 'zoomableFull'
      }
      , ratio: 2.0 // Viewport width is multiplied by this value to determine zoomed in width
      , seekImage: true // Ascend DOM level from trigger element to find nearest image to use as thumbnail. If set to false, no ascent would take place, and only images within initial context will be considered.
      , clickCloses: true // Whether clicking anywhere on zoomed in image will stop zooming   
      , activationEvent: 'click' // Override to use alternate event for all zoomable control interactions
      , canvasStyle: { // Default style applied to canvas. Overriding replaces the whole object.
          position: 'absolute'
        , width: '100%'
        , height: '100%'
        , overflow: 'auto'
      }
      , imageStyle: { // Default style applied to images within canvas. Overriding replaces the whole object.
          position: 'absolute'
        , top: '0'
        , left: '0'
        , maxWidth: 'none'
        , maxHeight: 'none'        
      }
      , stageHTML: function() { // Generator for HTML of zoomed in view. If overriding, you can call old function via Mobify.UI.Zoomable.defaults.stageHTML.call(this)
            return '<div class="' + this._getClass('canvas') + '"><img class="'
                + this._getClass('thumb') + '"><img class="'
                + this._getClass('full') + '"></div>';
      }
      , globalStyle: function() { // Generator for global CSS (ignored if zoomable content injected into non-body element). If overriding, you can call old function via Mobify.UI.Zoomable.defaults.globalStyle.call(this)
            var zooming = '.' + this._getClass('zooming');
            return zooming + ' { overflow: hidden; }'
              + zooming + ' > * { display: none !important; }'
              + zooming + ' > .' + this._getClass('control') + ' { display: block !important; }';
      }
    };

## Limitations

Zoomable relies on click event for activation and deactivation. This results in about ~300ms delay in iOS, as Mobile Safari waits to ensure that event in question is a single tap rather than built-in page zooming double tap. We do not bundle a quick tap implementation with zoomable, but you can attach a tap event manually. Here is an example of custom binding that uses [jQuery tappable](https://github.com/aanand/jquery.tappable.js/blob/master/jquery.tappable.js):


    var el = $('a.zoomable').zoomable();
    el.tappable(function() { $(this).zoomable('show'); });
	
Other quick touch implementations can be used in similar ways.
