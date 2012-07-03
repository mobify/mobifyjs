# Understanding Templates
    
In Mobify.js, templates are used to remix the source DOM and give you control over the output of your page. A template is a text file that contains regular HTML markup, as well as variables that are replaced when the template is rendered. 

The context for the variable replacement comes from your project's konf, where you make selections from your original source DOM and match these selections to specific templates. [Learn more about konf files] https://support.mobify.com/customer/portal/articles/511656-understanding-the-konf

The following konf renders the `home` template to the browser:

    'mobileSite': function(context) {
        return context.choose({
            'templateName': 'home',
            '!products': function(context) {
                return $('#products')
            }
        })
    },
    'OUTPUTHTML': function(context) {
        var templateName = context.data('mobileSite.templateName')
        if (templateName) {
            return context.tmpl(templateName);
        }
    }

A common pattern is to create an object in the konf that selects data from the source DOM, then call `context.tmpl(templateName)` and assign the result to the `OUTPUTHTML` key.

In this example, if the `home` object was matched, then the value `home` will be assigned to the key `mobileSite.templateName`. Mobify.js compiles files matching _/src/tmpl/<filename>.tmpl_ and makes them available to the `context.tmpl` function under their filename. This example would render the template _home_, which is compiled from _src/tmpl/home.tmpl_. This is explained in more detail in the [konf reference] https://support.mobify.com/customer/portal/articles/511630-konf-reference

Templates are text files that construct a HTML document. The _home_ template could look like this:

    <!DOCTYPE html>
    <html>
    <head><title>Home</title></head>
    <body>
        <ul>
            {#content.products}
                <li>{.}</li>
            {/content.products}
        </ul>
    </body>
    </html>

Assuming that the key `content.products` selected a set of `<div>` elements, calling `context.tmpl('home')` would evaluate the template with the selected data, producing the following markup:

    <!DOCTYPE html>
    <html>
    <head><title>Homepage</title></head>
    <body>
        <ul>
            <li><div>Product 1</div></li>
            <li><div>Product 2</div></li>
            <li><div>Product 3</div></li>
        </ul>
    </body>
    </html>