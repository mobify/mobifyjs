define(["./mobifyjs"], function(Mobify) {
    var phoenix = Mobify.phoenix = {
            keep: [
                "vendor/jquery", "vendor/zepto"
              , "mobifyjs/mobifyjs", "mobifyjs/noconflict", "mobifyjs/phoenix"
            ]
          , register: function(name) {
                this.keep.push('mobifyjs/' + name);
            }
          , getRebornJS: function() {
                var fragments = concatenatedJS.toString().split(/define\((['"])(.+?)(\1)/);
                var moduleBodies = [fragments[0]];
                var moduleNames = [];
                var keepObj = {};
                phoenix.keep.forEach(function(x) { keepObj[x] = false; });

                for (var i = 1; i < fragments.length; i += 4) {
                    if (!keepObj[fragments[i + 1]]) continue;
                    moduleBodies.push('define', '('); //Prevent self-parsing
                    moduleBodies.push.apply(moduleBodies, fragments.slice(i, i + 4));
                    moduleNames.push(fragments[i + 1]);
                }
                
                if (moduleNames.length) moduleBodies.push('\nrequire(["', moduleNames.join('","'), '"]);');
                return '(' + moduleBodies.join('') + '})();';
            }
        };

    if (!navigator.userAgent.match(/webkit/i)) {
        var oldDocOpen = document.open;
        document.open = function() {
            var rebornJS = phoenix.getRebornJS();

            copy(rebornJS);
            oldDocOpen.apply(document, arguments);
            document.open = oldDocOpen;

            window.eval(rebornJS);
        };
    }

    return phoenix;
});