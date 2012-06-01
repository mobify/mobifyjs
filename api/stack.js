(function($, _) {
    var Stack = Mobify.data2.stack = function(head, parent, idx, len) {
        this.tail = parent;
        this.head = head;
        this.index = idx;
        this.len = len;
    }
    ,refRe = /^[^!?.]*(\.[^!?.]+)*$/i;

    Stack.prototype = {
         _mobifyStack: true
        ,extend : function(head, idx, len) {
            return new Stack(head, this, idx, len);
        }
        ,crumbs: function() {
            var crumbs = _(this).chain().pluck('index')
                .reject(function(idx) { return idx == undefined})
                .reverse().value();

            crumbs.toString = function() { return this.join('.') };
            return crumbs;
        }
        ,get: function(key) {
            var stack = this;
            while (!(key in stack.head) && stack.tail)
                stack = stack.tail;
            return stack.head && stack.head[key];
        }
        ,set: function(key, value) {
            return this.head[key] = value;
        }
        ,ref: function(selector, preferLocalAssignment) {
                       
            var  parsed = (selector || "").toString().match(refRe)
                ,stack = this, tokens, token, crumbs, head;

            if (!parsed) return;

            tokens = parsed[0].split('.');
            token = tokens[0];

            if (token
                // If token is numeric and stack.head is an array, we should
                // disable ascending logic and force local assignment. Otherwise,
                // we risk ending up with unwanted overwrites in cases of nested arrays
                && (isNaN(token) || !_.isArray(stack.head))) {
                while (!(token in stack.head) && stack.tail)
                    stack = stack.tail;
            }
            if (!(token in stack.head) && preferLocalAssignment) stack = this;

            crumbs = stack.crumbs();
            crumbs.pop();
            crumbs.push.apply(crumbs, tokens);

            head = stack.head;

            var value = head,
                i = 0;
            while ((tok = tokens[i++]) !== undefined) {
                if (tok == "") {
                    value = head;
                } else {
                    head = value;
                    token = tok;
                    value = head ? head[tok] : undefined; 
                }
            }

            if ((head && (token in head)) || preferLocalAssignment) return {
                 target: head
                ,value: value
                ,key: token
                ,crumbs: crumbs
            }
        }
    };
})(Mobify.$, Mobify._);