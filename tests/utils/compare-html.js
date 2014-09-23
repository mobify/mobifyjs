// `DOMParser` polyfill inspired by https://gist.github.com/1129031
(function(DOMParser) {
    "use strict";

    var
      proto = DOMParser.prototype
    , nativeParse = proto.parseFromString
    ;

    // Firefox/Opera/IE throw errors on unsupported types
    try {
        // WebKit returns null on unsupported types
        if ((new DOMParser()).parseFromString("", "text/html")) {
            // text/html parsing is natively supported
            return;
        }
    } catch (ex) {}

    proto.parseFromString = function(markup, type) {
        if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
            var
              doc = document.implementation.createHTMLDocument("")
            ;
                if (markup.toLowerCase().indexOf('<!doctype') > -1) {
                    doc.documentElement.innerHTML = markup;
                }
                else {
                    doc.body.innerHTML = markup;
                }
            return doc;
        } else {
            return nativeParse.apply(this, arguments);
        }
    };
}(DOMParser));

// Parses two HTML strings and recursively compares their elements to
// determine whether they match independent of whitespace or attribute
// ordering. Returns a boolean.
function compareHTMLStrings(first, second) {
    var parser = new DOMParser();
    var firstDoc = parser.parseFromString(first, "text/html");
    var secondDoc = parser.parseFromString(second, "text/html");

    // Filters empty filler text nodes that can cause inconsistencies
    // between compared HTML strings.
    function filterEmptyTextNodes(nodes) {
        var filteredNodes = [];

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.nodeName == '#text' &&
                    (!node.textContent || /^\s*$/.test(node.textContent))) {
                continue;
            }
            filteredNodes.push(node);
        }

        return filteredNodes;
    }

    // Returns a boolean that indicates whether `node2` has `node`'s
    // attributes.
    function nodeHasAttributes(node, node2) {
        if (node.attributes) {
            for (var i = 0; i < node.attributes.length; i++) {
                var nodeAttribute = node.attributes[i];
                if (nodeAttribute.value != node2.getAttribute(nodeAttribute.name)) {
                    return false;
                }
            }
        }
        return true;
    }

    function recursiveCompare(node, node2) {
        // Ensure node names match.
        if (node.nodeName != node2.nodeName) {
            return false;
        }

        // Ensure node attributes match.
        if (!nodeHasAttributes(node, node2) || !nodeHasAttributes(node2, node)) {
            return false;
        }

        // Ensure values match.
        if ((node.nodeName == '#text' || node.nodeName == '#comment') &&
                node.textContent != node2.textContent) {
            return false;
        }

        var childNodes = filterEmptyTextNodes(node.childNodes);
        var childNodes2 = filterEmptyTextNodes(node2.childNodes);

        // Ensure they have the same amount of child nodes.
        if (childNodes.length != childNodes2.length) {
            return false;
        }

        // Compare child nodes recursively.
        for (var i = 0; i < childNodes.length; i++) {
            if (!recursiveCompare(childNodes[i], childNodes2[i])) {
                return false;
            }
        }

        return true;
    }

    return recursiveCompare(firstDoc, secondDoc);
};
