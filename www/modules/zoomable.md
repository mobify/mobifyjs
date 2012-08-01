---
layout: modules
title: Mobify.js Zoomable Module
---

<style>
.zoomable-notice {
    position: absolute; left: 50%; top: 50%;
    width: 300px; height: 36px; margin-left: -160px; margin-top: -28px; padding: 10px;
    vertical-align: middle; text-align: center; font-weight: bold; font-size: 16px; line-height: 18px;
    background: rgba(0,0,192,0.5); color: white; 
    opacity: 1;
}
.zoomable-notice-fade {
    -webkit-transition: opacity 4s ease-in; 
    -o-transition: opacity 4s ease-in; 
    -moz-transition: opacity 4s ease-in; 
    -ms-transition: opacity 4s ease-in; 
    transition: opacity 4s ease-in;
    opacity: 0;
 }
</style>
<script src="{{ site.baseurl }}/static/examples/js/zoomable.js"></script>

# Zoomable

A module for showing and panning through large images in a touchscreen-friendly way. Can be configured to use custom HTML and CSS in zoomed-in state.

<p class="exit-notice-zoomable"><a href="{{ site.baseurl }}/static/examples/img/zoom_big.jpg"><img src="{{ site.baseurl }}/static/examples/img/zoom_thumb.jpg" style="width: 100%"></a>
</p>
<script>$('.exit-notice-zoomable a').zoomable({ stageHTML: function() {
  return Mobify.UI.Zoomable.defaults.stageHTML.call(this)
      + '<div class="zoomable-notice m-close">Tap anywhere to close. On touchscreen device, drag to navigate</div>';
}}).bind('afterOpen.zoomable', function() {
  $('.zoomable-notice').addClass('zoomable-notice-fade');
}).bind('beforeClose.zoomable', function() {
  $('.zoomable-notice').removeClass('zoomable-notice-fade');
})</script>

<div class="btn-container">
  <a href="{{ site.baseurl }}/static/downloads/zoomable.zip" class="btn btn-primary">Download Zoomable</a>
  <a href="{{ site.baseurl }}/modules/zoomable-examples" class="see-examples">See more examples</a>
</div>


## Using Zoomable.js

Zoomable generates its own HTML. All you need to provide is references to your thumbnail and zoomed-in images:

    <a class="zoomable" href="big.jpg"><img src="thumb.jpg"></a>
    <script>$('a.zoomable').zoomable();</script>

The &lt;a&gt; element that is passed to zoomable should reference the high resolution image that you are trying to show. The image inside provides thumbnail URL. If image is not found inside the link, zoomable will ascend DOM tree until it finds one nearby.

Once thumbnail image is clicked, thumbnail will be magnified and shown to the user. High resolution image will replace the thumbnail upon load. User can navigate around by dragging the scaled up image, and leave zoomed in view by tapping the image. If user arrived at zoomed in view by clicking on image thumbnail, initial view will center on part of the image corresponding to tapped section. For example, tapping bottom left corner of thumbnail will start zoomable focusing at bottom left part of high resolution image.

## Methods

### .zoomable(options)

Initializes the zoomable with the options (an `object`) given.

    $('.zoomable').zoomable({
        classPrefix: "m-"
    });

### .zoomable('open')

Opens zoomable.

    $('.zoomable').zoomable('open');

### .zoomable('close')

Closes zoomable.

    $('.zoomable').zoomable('close');

### .zoomable('unbind')

Removes event handlers from the zoomable context.

    $('.zoomable').zoomable('unbind');

### .zoomable('bind')

Restores event handlers for the zoomable context.

    $('.zoomable').zoomable('bind');

### .zoomable('destroy')

Unbinds the events from the zoomable context, and removes it from the DOM.

    $('.zoomable').zoomable('destroy');


## Configuration

Below are the options available in the configuration object

| Name          | Default        | Description                               |   
|---------------|------------------------------------------------------------|
| classPrefix   | `"m-"`         |This prefix is inserted before all class references for conflict avoidance. For example, default close class will be `m-close`. |
| stage         | <body> element | DOM node that will receive generated zoomable markup. |
| classNames    | Object, see below | Contains class names for various parts of zoomable. Classes can be overriden individually. |
| ratio         | `2`            | Zoomed in image is magified to be `ratio` times bigger than the stage. |
| seekImage     | `true`         | If thumbnail image is not found in the anchor element used as context, Zoomable will go up in DOM tree until it finds nearby image. Set to `false` to restrict image lookups to stay within context 
| clickCloses   | `true`         | Specifies if clicking or tapping in place on the magnified image should close magnified view |
| activationEvent | `"click"` | Override to use alternate event for all zoomable control interactions |
| canvasStyle  | Object, see below | Extra CSS properties to be applied to canvas. You can delete default properties by setting their value to `undefined`. | 
| imageStyle   | Object, see below | Extra CSS properties to be applied to low-res and high-res magnified image. You can delete default properties by setting their value to `undefined`. |
| stageHTML | Function | Generates HTML of magnified state of zoomable module. See examples to see how to change it |
| globalStyle | Function | Generates CSS for zoomable acting upon <body>. Typically should be left as-is.

## Classes

| Name        | Class       | Description                                                                                       |           
|-------------|---------------------------------------------------------------------------------------------------|
| zooming| m-`zooming` | Applied to stage (usually body element) when zoomable is active |
| close| m-`close` | Should be added to custom close buttons within zoomable markup |
| control| m-`zoomableControl` | Internal, added to all top-level elements injected by zoomable |
| canvas| m-`zoomableCanvas` | Applied to div wrapper that contains both low and high resolution images |
| thumb| m-`zoomableThumb` | Applied to low resolution (thumbnail) image |
| full| m-`zoomableFull` | Applied to high resolution image |

## Default styles

These are the default styles applied to magnified image(s) and their container.

### canvasStyle
    { 
        position: 'absolute'
      , width: '100%'
      , height: '100%'
      , overflow: 'auto'
    }

### imageStyle
    { 
        position: 'absolute'
      , top: '0'
      , left: '0'
      , maxWidth: 'none'
      , maxHeight: 'none'        
    }

## Events

The element that `.zoomable()` call used as a context emits the following events:

| Name          | Description                               |   
|---------------|-------------------------------------------|
| beforeOpen    | Fired before zoomable starts opening      |
| afterOpen     | Fired when zoomable is fully open         |
| beforeClose   | Fired before zoomable starts closing      |
| afterClose    | Fired after zoomable finishes closing     |

## Limitations

Zoomable relies on click event for activation and deactivation. This results in about ~300ms delay in iOS, as Mobile Safari waits to ensure that event in question is a single tap rather than built-in page zooming double tap. We do not bundle a quick tap implementation with zoomable, but you can attach a tap event manually. Here is an example of custom binding that uses [jQuery tappable](https://github.com/aanand/jquery.tappable.js/blob/master/jquery.tappable.js):

    var el = $('a.zoomable').zoomable();
    el.tappable(function() {
        $(this).zoomable('show');
    });
	
Other quick touch implementations can be used in similar ways.
