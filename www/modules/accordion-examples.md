---
layout: modules
title: Mobify.js Accordion Examples
---

<link rel="stylesheet" href="{{ site.baseurl }}/static/examples/css/accordion.css">
<link rel="stylesheet" href="{{ site.baseurl }}/static/examples/css/accordion-style.css">

# Accordion Examples


<h2>Basic Accordion</h2>
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



<h2>Basic Accordion with Images</h2>
<ul class="m-accordion m-accordion-images">
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
