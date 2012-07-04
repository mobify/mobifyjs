Mobify.js adapts existing websites for mobile devices using their source HTML.
The Mobify.js tag loads a bundle, which contains the Konf, templates and other
resources. Using the 'Konf', we select and adapt HTML elements from the
original site content, then we render the adapted content using 'templates' to
produce a new page for the browser.

This guide will help you understand the contents of your project.

  
You will learn how to:

  * Use the Konf to select content from your site's source DOM.
  * Output your adaptation to the browser using templates.

* * *

In this guide:

  1. Tutorial requirements
  2. Previewing your work
  3. Introducing the Konf
  4. Introducing Templates
  5. Creating a template for a different page of your site
  6. Pushing a bundle up to Cloud
  7. Publishing to Production


* * *

##  Tutorial requirements

**We assume you have have created a project and installed the mobify client.**

**[If you haven't, go do it now!](http://portal.mobify.com/projects/new/)**

##  Previewing your work

The Mobify Client allows you to preview changes you make to a bundle locally.

Do the following:

  1. In a Terminal window in your project's directory, run: 
  
      
          mobify preview
  
  
    This command will be generate a bundle locally, on the fly, as you edit your files. You'll want to keep this window open to see debugging information as you work on your mobified site.
  2. On http://cloud.mobify.com, navigate to your project, then click 'Preview' in the left-hand navigation. If preview is running, then 'localhost' will be selected by default.

Each time you make a change to your files, you can hit the refresh button to
see your changes. If you ever refresh, and suddenly you are viewing your
desktop site, then try opening up the javascript console.

##  What is a 'Konf'?

The Konf is JavaScript that selects and adapts content from a site's source
DOM. The selections made in the Konf are used as the context to render a
template, producing the mobified page. The Konf file is required in any Mobify
project, and by default lives at '**src/mobify.konf**'.

##  Templates

A template is a text file that contains variables which are replaced when the
template is rendered. In Mobify.js, templates are used to remix the source DOM
and give you control over the output of your mobified page.

By default, a project starts with four templates:

  * **base.tmpl**: An example base template which&nbsp_place_holder;contains the HTML skeleton of your project, which contains a default css file, viewport, and set of sane block placeholders which are ment to be overridden in other templates (such as home.tmpl).
  * **home.tmpl**: An example template for use with a home page
  * **_header.tmpl**: A template which gets included immediately below the opening body tag in base.tmpl
  * **_footer.tmpl**:&nbsp_place_holder;A template which gets included immediately above the closing body tag in base.tmpl


##  Creating a template for a different page of your site

Up to this point, we have a base template, a home template, a header template,
and a footer template. To mobify more pages, you will need more templates!

  
We'll adapt a hypothetical 'About' page for the purposes of this tutorial (If
you don't have an 'About' page, or want to try mobifying a different set of
pages, you can follow along, substituting 'About' with the page you want to
mobify)

You will want to uncomment the following block in your mobify.konf file:

    
    
    	/*{
            '!templateName': 'about',
            '!phonenumber' : function() {
                 return $('.selector_for_phone_number');
    	},
            '!blurb': function() {
                 return $('.selector_for_blurb');
            }
        }*/
    

Make sure you change **.selector_for_phone_number** and
**.selector_for_blurb** to something that is unique to the page you're
mobifying.

  
You may have noticed that this object you uncommented is an argument that gets
passed into context.choose(). In order to determine what template to use, the
Mobify frameworks determines which template to render by asking you to
describe what DOM elements must match for a particular template to render.
This DOM description is also used as the context which is used when rendering
templates - so you can see in the example above, you have a
"!phonenumber" and "!blurb" key, and if those keys match the DOM of the page,
then the "about" template will be rendered. These keys are then accessible as
data within the template (so, for example, you could access the phone number
like this: {content.phonenumber} ). Keys with ! prefixed are
_required_ in order for the template to render. Sometimes,
you may want to extract data from a page, but it isn't something that is
required in order to render the page. In that case, you simply add a key
without the ! prefix.

Now, you need to create a corresponding template for the 'About' page. Here is
an example of what it may look like.

### about.tmpl
    
    {>base/}
    
    {<content}
        <h1>About page</h1>
        <h3>My phone number: "{content.phonenumber}"</h3>
        <p>{content.blurb}</p>
    {/content}

Simply navigate to the about page (make sure `mobify preview` is still
running!, and you will see your About page rendered through Mobify.js. If for
some reason you see your desktop site, open up the javascript console to see
any potential errors.

## Pushing a bundle up to Cloud

Now that your site is looking decent, you might want to start thinking about 
pushing up bundles to the Cloud in order to view them on your mobile device, if you
have a bundle that you think you might want to publish to production.

In order to do that, you can simply go to the root directory of your project folder
and execute this command:

    mobify push --message "Initial Push"
    
After you've pushed, go back to the Preview page and refresh, and you will see the bundle
you just pushed in the "Available Bundles" dropdown. Once you select your bundle,
you'll notice that you can email this link to yourself or someone else in order to 
see it on your mobile phone through the interface on Cloud.

## Publishing to Production

Once you've gone through and modified your mobile site to your liking, you can publish your
bundle to production. Just click on the "Publishing" page on the left hand side, and you'll
see a list of bundles that you've pushed up to cloud. From there, you can select the one
you want to publish!
