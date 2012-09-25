define(["./adaptHTML", "../extractDOM", "../anchorQuery", "../transform", "../externals", "../timing", "../mobifyjs"], function(adaptDOM, extractDOM, anchorQuery, transform, externals, timing, Mobify) {
    function stringifyResult(obj) {
        obj = obj || "";

        if (obj.outerHTML) obj = obj.outerHTML;
        if (obj.appendTo) obj = obj.map(function(el) { return el.outerHTML || "" }).join("");
        if (obj.document) obj = obj.document;
        if (obj.nodeType === Node.DOCUMENT_NODE) {
            obj = Mobify.html.doctype(doc) + obj.document.documentElement.outerHTML;
        }

        return obj;
    };

    function noConflict(source) {
        var $ = window.$ || Mobify.$;
        if (!$) return;

        if ($.noConflict) {
            Mobify.$ = $.noConflict(true);
            delete window.jQuery;
        } else if ($.zepto) {
            Mobify.$ = $;
            Mobify.$.support = Mobify.$.support || {};
            if (window.Zepto === window.$) delete window.$;
            delete window.Zepto;
        } else return function(selector) {
            return source.document.querySelectorAll(selector);
        }

        return anchorQuery(source);
    }

    return transform.adaptDOM = function(adaptFn) {
        transform.adaptHTML(function(source, callback) {
            var disabledSource = externals.disable(source);
            timing.addPoint('Disabled external resources');

            var dom = extractDOM(disabledSource);
            timing.addPoint('Created passive document');

            this.$ = noConflict(dom.document);

            adaptFn.call(this, dom, function(result) {
                var flattenedResult = stringifyResult(result);
                var enabledResult = externals.enable(flattenedResult);
                return callback(enabledResult);
            });
        });
    }
});