---
layout: modules
title: Mobify.js Accordion Examples
---

<link rel="stylesheet" href="{{ site.baseurl }}/static/examples/css/accordion.css">
<link rel="stylesheet" href="{{ site.baseurl }}/static/examples/css/accordion-style.css">
<style type="text/css">

.m-css-advanced .m-header:after {
    color: rgba(255,255,255,0.9);
    font-weight: normal;
    text-align: center;
    text-shadow: none;
    background: #bfbfbf;
    background: #c5c5c5; /* Old browsers */
    background: -moz-linear-gradient(top,  #c5c5c5 1%, #acacac 100%); /* FF3.6+ */
    background: -webkit-gradient(linear, left top, left bottom, color-stop(1%,#c5c5c5), color-stop(100%,#acacac)); /* Chrome,Safari4+ */
    background: -webkit-linear-gradient(top,  #c5c5c5 1%,#acacac 100%); /* Chrome10+,Safari5.1+ */
    background: -o-linear-gradient(top,  #c5c5c5 1%,#acacac 100%); /* Opera 11.10+ */
    background: -ms-linear-gradient(top,  #c5c5c5 1%,#acacac 100%); /* IE10+ */
    background: linear-gradient(to bottom,  #c5c5c5 1%,#acacac 100%); /* W3C */
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
    background: #909090;
}
.m-css-advanced .m-active .m-header:after {
    background: #999;
    background: -moz-linear-gradient(top,  #8a8a8a 0%, #a3a3a3 100%); /* FF3.6+ */
    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#8a8a8a), color-stop(100%,#a3a3a3)); /* Chrome,Safari4+ */
    background: -webkit-linear-gradient(top,  #8a8a8a 0%,#a3a3a3 100%); /* Chrome10+,Safari5.1+ */
    background: -o-linear-gradient(top,  #8a8a8a 0%,#a3a3a3 100%); /* Opera 11.10+ */
    background: -ms-linear-gradient(top,  #8a8a8a 0%,#a3a3a3 100%); /* IE10+ */
    background: linear-gradient(to bottom,  #8a8a8a 0%,#a3a3a3 100%); /* W3C */
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
                <p> Williamsburg quinoa sartorial, tattooed VHS food truck polaroid authentic gentrify Austin readymade vinyl dreamcatcher freegan seitan.</p> 
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



<h2>Image Indicators</h2>
<p>The basic accordion control with images to reveal when a header is expanded or collapsed.</p>
<ul class="m-accordion m-indicators-images">
    <li class="m-item">
        <h3 class="m-header">
            <a>Portland</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p>Pickled keytar ethnic flexitarian, vegan ethical sartorial 8-bit yr williamsburg. Flexitarian typewriter viral, wolf banh mi gastropub letterpress street art mcsweeney's raw denim kogi semiotics blog.</p>
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>Willamsburg</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p> Williamsburg quinoa sartorial, tattooed VHS food truck polaroid authentic gentrify Austin readymade vinyl dreamcatcher freegan seitan.</p> 
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>Austin</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p>Trust fund mustache typewriter, portland artisan irony seitan master cleanse biodiesel ethnic banh mi bushwick squid semiotics truffaut. Marfa vinyl mumblecore, selvage beard kale chips gentrify four loko gluten-free messenger bag cliche vice forage.</p>
            </div>
        </div>
    </li>
</ul>


<h2>Basic CSS Indicators</h2>
<p>The basic accordion control with image-less CSS indicators that reveal when a header is expanded or collapsed.</p>
<ul class="m-accordion m-indicators-css">
    <li class="m-item">
        <h3 class="m-header">
            <a>Portland</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p>Pickled keytar ethnic flexitarian, vegan ethical sartorial 8-bit yr williamsburg. Flexitarian typewriter viral, wolf banh mi gastropub letterpress street art mcsweeney's raw denim kogi semiotics blog.</p>
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>Willamsburg</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p> Williamsburg quinoa sartorial, tattooed VHS food truck polaroid authentic gentrify Austin readymade vinyl dreamcatcher freegan seitan.</p> 
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>Austin</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p>Trust fund mustache typewriter, portland artisan irony seitan master cleanse biodiesel ethnic banh mi bushwick squid semiotics truffaut. Marfa vinyl mumblecore, selvage beard kale chips gentrify four loko gluten-free messenger bag cliche vice forage.</p>
            </div>
        </div>
    </li>
</ul>


<h2>Advanced CSS Indicators</h2>
<p>The basic accordion control with more advanced CSS-only indicators in the same style as the image indicators.</p>
<ul class="m-accordion m-indicators-css m-css-advanced">
    <li class="m-item">
        <h3 class="m-header">
            <a>Portland</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p>Pickled keytar ethnic flexitarian, vegan ethical sartorial 8-bit yr williamsburg. Flexitarian typewriter viral, wolf banh mi gastropub letterpress street art mcsweeney's raw denim kogi semiotics blog.</p>
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>Willamsburg</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p> Williamsburg quinoa sartorial, tattooed VHS food truck polaroid authentic gentrify Austin readymade vinyl dreamcatcher freegan seitan.</p> 
            </div>
        </div>
    </li>
    <li class="m-item">
        <h3 class="m-header">
            <a>Austin</a>
        </h3>
        <div class="m-content">
            <div class="m-inner-content">
                <p>Trust fund mustache typewriter, portland artisan irony seitan master cleanse biodiesel ethnic banh mi bushwick squid semiotics truffaut. Marfa vinyl mumblecore, selvage beard kale chips gentrify four loko gluten-free messenger bag cliche vice forage.</p>
            </div>
        </div>
    </li>
</ul>





<script src="{{ site.baseurl }}/static/examples/js/accordion.js"></script>
<script>
    $(function() { $('.m-accordion').accordion(); });
</script>
