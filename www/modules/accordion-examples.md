---
layout: modules
title: Mobify.js Accordion Examples
---

<link rel="stylesheet" href="{{ site.baseurl }}/static/examples/css/accordion.css">
<link rel="stylesheet" href="{{ site.baseurl }}/static/examples/css/accordion-style.css">

.m-indicators-css .m-header {
    border-color: #f6dada;
    background: #fdf7f7; /* Old browsers */
    background: -moz-linear-gradient(top,  #fdf7f7 0%, #fae9e9 100%); /* FF3.6+ */
    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#fdf7f7), color-stop(100%,#fae9e9)); /* Chrome,Safari4+ */
    background: -webkit-linear-gradient(top,  #fdf7f7 0%,#fae9e9 100%); /* Chrome10+,Safari5.1+ */
    background: -o-linear-gradient(top,  #fdf7f7 0%,#fae9e9 100%); /* Opera 11.10+ */
    background: -ms-linear-gradient(top,  #fdf7f7 0%,#fae9e9 100%); /* IE10+ */
    background: linear-gradient(to bottom,  #fdf7f7 0%,#fae9e9 100%); /* W3C */
}
.m-indicators-css .m-header a {
    color: #600;
}
.m-indicators-css .m-header:hover {
    background: #fae9e9;
    border-color: #f3cece;
}
.m-indicators-css .m-header:after {
    color: #900;
}



.m-css-advanced .m-header {
    border-color: #d3e2e7;
    background: #e9f0f3; /* Old browsers */
    background: -moz-linear-gradient(top,  #e9f0f3 0%, #dfeaed 100%); /* FF3.6+ */
    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#e9f0f3), color-stop(100%,#dfeaed)); /* Chrome,Safari4+ */
    background: -webkit-linear-gradient(top,  #e9f0f3 0%,#dfeaed 100%); /* Chrome10+,Safari5.1+ */
    background: -o-linear-gradient(top,  #e9f0f3 0%,#dfeaed 100%); /* Opera 11.10+ */
    background: -ms-linear-gradient(top,  #e9f0f3 0%,#dfeaed 100%); /* IE10+ */
    background: linear-gradient(to bottom,  #e9f0f3 0%,#dfeaed 100%); /* W3C */
}
.m-css-advanced .m-header:hover {
    background: #dfeaed;
    border-color: #c4d8df;
}
.m-css-advanced .m-header a {
    color: #32525c;
}
.m-css-advanced .m-header:after {
    color: rgba(255,255,255,0.9);
    font-weight: normal;
    text-align: center;
    text-shadow: none;
    background: #1984b2; /* Old browsers */
    background: -moz-linear-gradient(top,  #1984b2 0%, #006b99 100%); /* FF3.6+ */
    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#1984b2), color-stop(100%,#006b99)); /* Chrome,Safari4+ */
    background: -webkit-linear-gradient(top,  #1984b2 0%,#006b99 100%); /* Chrome10+,Safari5.1+ */
    background: -o-linear-gradient(top,  #1984b2 0%,#006b99 100%); /* Opera 11.10+ */
    background: -ms-linear-gradient(top,  #1984b2 0%,#006b99 100%); /* IE10+ */
    background: linear-gradient(to bottom,  #1984b2 0%,#006b99 100%); /* W3C */
    font-size: 22px;
    line-height: 16px;
    width: 20px;
    height: 20px;
    margin-top: -10px;
    -webkit-border-radius: 25px;
    -moz-border-radius: 25px;
    border-radius: 25px;
    -webkit-box-shadow: #fff 0 1px 0;
    -moz-box-shadow: #fff 0 1px 0;
    box-shadow: #fff 0 1px 0;
}
.m-css-advanced .m-header:hover:after {
    color: #fff;
    background: #198ebf; /* Old browsers */
    background: -moz-linear-gradient(top,  #198ebf 0%, #0075a6 100%); /* FF3.6+ */
    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#198ebf), color-stop(100%,#0075a6)); /* Chrome,Safari4+ */
    background: -webkit-linear-gradient(top,  #198ebf 0%,#0075a6 100%); /* Chrome10+,Safari5.1+ */
    background: -o-linear-gradient(top,  #198ebf 0%,#0075a6 100%); /* Opera 11.10+ */
    background: -ms-linear-gradient(top,  #198ebf 0%,#0075a6 100%); /* IE10+ */
    background: linear-gradient(to bottom,  #198ebf 0%,#0075a6 100%); /* W3C */
}
.m-css-advanced .m-active .m-header:after {
    background: #015c8a; /* Old browsers */
    background: -moz-linear-gradient(top,  #015c8a 0%, #1a75a3 100%); /* FF3.6+ */
    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#015c8a), color-stop(100%,#1a75a3)); /* Chrome,Safari4+ */
    background: -webkit-linear-gradient(top,  #015c8a 0%,#1a75a3 100%); /* Chrome10+,Safari5.1+ */
    background: -o-linear-gradient(top,  #015c8a 0%,#1a75a3 100%); /* Opera 11.10+ */
    background: -ms-linear-gradient(top,  #015c8a 0%,#1a75a3 100%); /* IE10+ */
    background: linear-gradient(to bottom,  #015c8a 0%,#1a75a3 100%); /* W3C */
    -webkit-box-shadow: #fff 0 -1px 0;
    -moz-box-shadow: #fff 0 -1px 0;
    box-shadow: #fff 0 -1px 0;
}

</style>

# Accordion Examples


<h2>Basic Accordion</h2>
<p>The basic accordion control with default styling.</p>
<ul class="m-accordion">
    <li class="m-item">
        <h3 class="m-header">
            <a>Food Trucks</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <h2>Put a bird on it</h2>
                <p>Pickled keytar ethnic flexitarian, vegan ethical sartorial 8-bit yr williamsburg. Flexitarian typewriter viral, wolf banh mi gastropub letterpress street art mcsweeney's raw denim kogi semiotics blog.</p>
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>PBR</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <h2>Helvetica</h2>
                <p>Williamsburg quinoa sartorial, tattooed VHS food truck polaroid authentic gentrify Austin readymade vinyl dreamcatcher freegan seitan.</p> 
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>Fixies</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <h2>You probably haven't heard of them</h2>
                <p>Fanny pack seitan PBR synth, kale chips master cleanse helvetica high life artisan you probably haven't heard of them. Craft beer salvia high life, art party small batch retro pickled butcher scenester kale chips brooklyn 8-bit vinyl.</p>
                <p>Trust fund mustache typewriter, portland artisan irony seitan master cleanse biodiesel ethnic banh mi bushwick squid semiotics truffaut. Marfa vinyl mumblecore, selvage beard kale chips gentrify four loko gluten-free messenger bag cliche vice forage.</p>
            </div>
        </div>
    </li>
</ul>

### Code for this example:

    <ul class="m-accordion">
      <li class="m-item">
        <h3 class="m-header">
          <a>Tab1</a>
        </h3>
        <div class="m-content">
          <div class="m-inner-content">
            <h2>Content 1</h2>
            <h2>Lorem Ipsum</h2>
          </div>
        </div>
      </li>
      <li class="m-item">
        <h3 class="m-header">
          <a>Tab2</a>
        </h3>
        <div class="m-content">
          <div class="m-inner-content">
            <h2>Content 2</h2>
            <p>Lorem Ipsum</p>
          </div>
        </div>
      </li>
    </ul>


<h2>Image Indicators</h2>
<p>The basic accordion control with images to reveal when a header is expanded or collapsed.</p>
<ul class="m-accordion m-indicators-images">
    <li class="m-item">
        <h3 class="m-header">
            <a>Portland</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p>Twee lo-fi Austin iphone, PBR farm-to-table small batch brunch food truck. Beard +1 chillwave, ennui Austin portland blog chambray 3 wolf moon fingerstache farm-to-table. Four loko pork belly lomo shoreditch biodiesel authentic. </p>
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>Willamsburg</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p>Fixie retro photo booth portland. Pop-up PBR hella, fingerstache photo booth beard tumblr aesthetic craft beer. Lo-fi banh mi cred, VHS squid sartorial helvetica pork belly high life brooklyn carles. Sustainable shoreditch bicycle rights fixie butcher street art.</p> 
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>Austin</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p>Williamsburg skateboard raw denim typewriter brooklyn 8-bit. Direct trade raw denim pitchfork gastropub umami. Mumblecore +1 pinterest, ethical terry richardson skateboard mcsweeney's trust fund shoreditch cliche chambray. Gluten-free portland organic cray carles vice.</p>
            </div>
        </div>
    </li>
</ul>

### Code for this example:

    <ul class="m-accordion m-indicators-images">
      <li class="m-item">
        <h3 class="m-header">
          <a>Tab1</a>
        </h3>
        <div class="m-content">
          <div class="m-inner-content">
            <h2>Content 1</h2>
            <h2>Lorem Ipsum</h2>
          </div>
        </div>
      </li>
      <li class="m-item">
        <h3 class="m-header">
          <a>Tab2</a>
        </h3>
        <div class="m-content">
          <div class="m-inner-content">
            <h2>Content 2</h2>
            <p>Lorem Ipsum</p>
          </div>
        </div>
      </li>
    </ul>



<h2>Textual Indicators</h2>
<p>The basic accordion control with +/- CSS indicators that reveal when a header is expanded or collapsed.</p>
<ul class="m-accordion m-indicators-css">
    <li class="m-item">
        <h3 class="m-header">
            <a>8-bit</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p>Truffaut bicycle rights mlkshk freegan williamsburg fingerstache. Kale chips before they sold out single-origin coffee, typewriter scenester craft beer +1. </p>
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>Photo Booth</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p>Twee skateboard butcher wolf sriracha. Wes anderson wolf ennui tattooed, marfa raw denim craft beer carles locavore bushwick synth pinterest biodiesel pour-over. Raw denim scenester keytar, bespoke mixtape VHS mlkshk banh mi before they sold out fixie.</p> 
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>Messenger Bag</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p>Authentic food truck jean shorts, viral 3 wolf moon kale chips synth leggings bushwick. Beard sriracha iphone jean shorts, banksy whatever biodiesel.</p>
            </div>
        </div>
    </li>
</ul>

### Code for this example:

    <ul class="m-accordion m-indicators-css">
      <li class="m-item">
        <h3 class="m-header">
          <a>Tab1</a>
        </h3>
        <div class="m-content">
          <div class="m-inner-content">
            <h2>Content 1</h2>
            <h2>Lorem Ipsum</h2>
          </div>
        </div>
      </li>
      <li class="m-item">
        <h3 class="m-header">
          <a>Tab2</a>
        </h3>
        <div class="m-content">
          <div class="m-inner-content">
            <h2>Content 2</h2>
            <p>Lorem Ipsum</p>
          </div>
        </div>
      </li>
    </ul>


<h2>CSS-only Indicators</h2>
<p>The same style as the image indicators above, but built with CSS-only instead of images.</p>
<ul class="m-accordion m-indicators-css m-css-advanced">
    <li class="m-item">
        <h3 class="m-header">
            <a>Kale Chips</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p>Iphone banksy fanny pack, portland pitchfork readymade messenger bag bushwick wes anderson mustache cardigan bespoke butcher mumblecore.</p>
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>Pork Belly</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p>Gentrify vinyl wayfarers yr mumblecore, hoodie pop-up PBR VHS 3 wolf moon bushwick leggings ethical. Salvia put a bird on it squid retro before they sold out chillwave, street art lomo selvage keytar cardigan.</p> 
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>Raw Vegan Organic</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p>Locavore brooklyn next level american apparel. Banksy 3 wolf moon readymade, fanny pack kale chips farm-to-table fap letterpress. Four loko photo booth single-origin coffee art party, seitan Austin direct trade mixtape.</p>
            </div>
        </div>
    </li>
</ul>


### Code for this example:

    <ul class="m-accordion m-indicators-css m-css-advanced">
      <li class="m-item">
        <h3 class="m-header">
          <a>Tab1</a>
        </h3>
        <div class="m-content">
          <div class="m-inner-content">
            <h2>Content 1</h2>
            <h2>Lorem Ipsum</h2>
          </div>
        </div>
      </li>
      <li class="m-item">
        <h3 class="m-header">
          <a>Tab2</a>
        </h3>
        <div class="m-content">
          <div class="m-inner-content">
            <h2>Content 2</h2>
            <p>Lorem Ipsum</p>
          </div>
        </div>
      </li>
    </ul>




<script src="{{ site.baseurl }}/static/examples/js/accordion.js"></script>
<script>
    $(function() { $('.m-accordion').accordion(); });
</script>
