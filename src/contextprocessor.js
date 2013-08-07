/* 
* A module for evaluating function and DOM element based template rendering 
* contexts.
*/

define(["utils"], function(Utils) {
/**
 * Takes a context object `context`, an object tree (no cycles plz) whose 
 * children are objects and arrays and leaves are javascript primitives and 
 * `HTMLElement`s
 */
var processContext = function(context) {
    var resultContext = {}, type, result;
    for(var key in context) {
        if (!context.hasOwnProperty(key)) {
            continue;
        }

        value = context[key];
        type = typeof value;

        // copy primitives
        if (type !== 'object' && type !== 'function') {
            resultContext[key] = value;
            continue;
        }

        // invoke functions
        if ('function' === typeof context[key]) {
            try {
                result = value(resultContext);
            } catch (e) {
                console.error(e);
                continue;
            }
            resultContext[key] = processContext(result);
            continue;
        }

        // serialize DOM nodes
        if(value instanceof HTMLElement) {
            resultContext[key] = Utils.outerHTML(value);
            continue;
        }

        // recursively traverse objects (arrays included)
        resultContext[key] = processContext(value);
    }
    return resultContext;
};

return processContext;
});