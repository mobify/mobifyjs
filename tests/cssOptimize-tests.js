require(["mobifyjs/utils", "mobifyjs/cssOptimize"], function(Utils, CssOptimize) {
    module("cssOptimize");    
    test("cssOptimize - optimize (rewrites a <link> element's href)", function() {
        var links = document.querySelectorAll("#disabled-stylesheet-link link");

        CssOptimize.optimize(links);
        
        strictEqual(links[0].getAttribute("x-href"), "//jazzcat.mobify.com/project-oss-localhost/cssoptimizer/http://localhost:3000/foo.css");
    });

    test("getCssUrl", function() {
        var styleSheetUrl = 'http://www.example.com/static/style.css'
        var options = {
            'bare': {},
            'project': {
                projectName: 'amazing'
            }
        }
        var expected = {
            'bare': '//jazzcat.mobify.com/project-oss-localhost/cssoptimizer/' + styleSheetUrl,
            'project': '//jazzcat.mobify.com/project-amazing/cssoptimizer/' + styleSheetUrl
        }
        for (var key in options) {
            strictEqual(CssOptimize.getCssUrl(styleSheetUrl, options[key]), expected[key], key);
        }
    });

    test('_rewriteHref', function() {
        var l = document.createElement("link");
        var href =  "/style.css"
        
        l.setAttribute("x-href", "/style.css");
        CssOptimize._rewriteHref(l, CssOptimize._defaults);
        
        strictEqual(l.getAttribute("x-href"), "//jazzcat.mobify.com/project-oss-localhost/cssoptimizer/http://localhost:3000/style.css", "rewrites a good URL");
        strictEqual(l.getAttribute("onerror"), CssOptimize._defaults.onerror, 
              "sets onerror attribute correctly");
        strictEqual(l.getAttribute("data-orig-href"), "/style.css",
              "sets data-orig-href attribute correctly");

        href = "gopher://archie/style.css"
        l.setAttribute("x-href", href)
        CssOptimize._rewriteHref(l, CssOptimize._defaults);

        strictEqual(l.getAttribute("x-href"), href, 
            "doesn't change non-http url");

    });

    test('restoreOriginalHref', function() {
        var l = document.createElement('link'),
            origHref = 'bar';
        l.setAttribute('data-orig-href', origHref);
        l.setAttribute('href', 'foo');

        cssOptimize.restoreOriginalHref({target: l});

        strictEqual(l.getAttribute('href'), origHref);
    });
});