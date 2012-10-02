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
                var moduleBodies = ['(', require.declaration, ')()'];
                var moduleNames = [];
                var keepObj = {};

                phoenix.keep.forEach(function(x) { keepObj[x] = true; });

                require.all.forEach(function(dep) {
                    if (!keepObj[dep[0]]) return;
                    var prereqs = "";
                    if (dep[1].length) {
                        prereqs = '["' + dep[1].join('", "') + '"], ';
                    }
                    moduleBodies.push('\ndefine("', dep[0], '", ', prereqs, dep[2], ');');
                    moduleNames.push(dep[0]);
                });
                
                if (moduleNames.length) {
                    moduleBodies.push('\nrequire(["', moduleNames.join('","'), '"]);');
                }
                return moduleBodies.join('');
            }
        };

    if (!navigator.userAgent.match(/webkit/i)) {
        var oldDocOpen = document.open;
        document.open = function() {
            var rebornJS = phoenix.getRebornJS();

            oldDocOpen.apply(document, arguments);
            document.open = oldDocOpen;

            window.eval(rebornJS);
        };
    }

    return phoenix;
});