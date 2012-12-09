define(["../noconflict", "./adaptHTML", "../extractDOM", "../anchorQuery", "../transform", "../externals", "../timing", "../mobifyjs", "../phoenix"],

function($, adaptDOM, extractDOM, anchorQuery, transform, externals, timing, Mobify) {
    function stringifyResult(obj) {
        obj = obj || "";

        if (obj.outerHTML) obj = obj.outerHTML;
        if (obj.appendTo) obj = obj.map(function(el) { return el.outerHTML || "" }).join("");
        if (obj.document) obj = obj.document;
        if (obj.nodeType === Node.DOCUMENT_NODE) {
            obj = Mobify.html.doctype(obj) + obj.documentElement.outerHTML;
        }

        return obj;
    };

    return transform.adaptDOM = function(adaptFn) {
        transform.adaptHTML(function(source, callback) {
            var disabledSource = externals.disable(source);
            timing.addPoint('Disabled external resources');

            var dom = extractDOM(disabledSource);
            timing.addPoint('Created passive document');

            this.$ = anchorQuery(dom.document);

            adaptFn.call(this, dom, function(result) {
                var flattenedResult = stringifyResult(result);
                var enabledResult = externals.enable(flattenedResult);
                return callback(enabledResult);
            });
        });
    }
});