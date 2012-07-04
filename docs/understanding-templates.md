# Understanding Templates
    
With Mobify.js, you use templates to place the selections you make from the source DOM into the mobified web page. A template is a text file that contains regular HTML markup, as well as variables that are replaced with the selections from your konf when the template is rendered. [Learn more about konf files](https://support.mobify.com/customer/portal/articles/511656-understanding-the-konf)

A common pattern is to create an object in the konf that selects data from the source DOM, then call `context.tmpl(templateName)` to render the template and assign the result to the `OUTPUTHTML` key.

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
        var templateName = context.data(mobileSite.templateName)
        if (templateName) {
            return context.tmpl(templateName);
        }
    }


In this example, if the `home` object is matched, then the value `home` will be assigned to the key `mobileSite.templateName`. 

Mobify.js compiles all files ending in _.tmpl_ in the _/src/tmpl/_ directory and makes them available to the `context.tmpl()` function as the protion fo their filename before _.tmpl_. 

This example would render the template _home_, which is compiled from _src/tmpl/home.tmpl_. This is explained in more detail in the [konf reference](https://support.mobify.com/customer/portal/articles/511630-konf-reference)

Templates are text files that construct an HTML document. Our _home_ template looks like this:

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

Assuming that the key `content.products` selected a set of `<div>` elements, calling `context.tmpl('home')` would evaluate the template with the selected data, producing a string containing the following markup:

    <!DOCTYPE html>
    <html>
    <head><title>Home</title></head>
    <body>
        <ul>
            <li><div>Product 1</div></li>
            <li><div>Product 2</div></li>
            <li><div>Product 3</div></li>
        </ul>
    </body>
    </html>