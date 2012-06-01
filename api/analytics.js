/* DEPRECATED DEPRECATED DEPRECATED DEPRECATED DEPRECATED DEPRECATED DEPRECATED */
/* DEPRECATED DEPRECATED DEPRECATED DEPRECATED DEPRECATED DEPRECATED DEPRECATED */

/* This is now only used by api-legacy js konfs.  Look at analytics.tmpl in the 
   template directory for up to date info. */

/* DEPRECATED DEPRECATED DEPRECATED DEPRECATED DEPRECATED DEPRECATED DEPRECATED */
/* DEPRECATED DEPRECATED DEPRECATED DEPRECATED DEPRECATED DEPRECATED DEPRECATED */


// TODO: It would be nice if these scripts were more natural in the mobify.js flow.
// TODO: Rename these functions, they're not just about GA anymore.
(function($, _) {
    window._gaq = window._gaq || [];

    var ga = Mobify.ga = {

        init: function() {
            // Load time rounded to nearest 100ms.
            var ed =  Mobify.evaluatedData;
            var start;
            try {
                start = Mobify.timing.points[0][0];    
            } catch (err) {
                start = undefined;
            }
            
            var loadTime = Math.round((Mobify.timing.addPoint('Done') - start) / 100) * 100;
            var template = ed.bodyType || ed.rootPageType || 'miss';
            //var buildDate = (ed.siteConfig.buildDate || (ed && ed.buildDate)) + '';
            var buildDate = (
                (ed.siteConfig && ed.siteConfig.buildDate) ||
                (ed.buildDate)
            ) + '';

            // http://code.google.com/apis/analytics/docs/tracking/gaTrackingCustomVariables.html
            // _setCustomVar scope levels:
            //    1 => Visitor
            //    2 => Session
            //    3 => Page (default)
            
            // TODO: If they have multiple domains we need to configure a single tracking.

            // this looks weird but it's populated down in the push: definition
            var ga_args = [['_setAccount', null]]; 
            // If we have site or konf specified args, populate them here, otherwise assume domain 'none'
            // Corollory: this means site specified arguments should ALWAYS include _setDomainName

            var ga_domain = (function(hostname, domain_dict){
                var domain = 'none';
                if (! domain_dict) return domain;
                var hostname_parts = hostname.split('.');

                while (hostname_parts.length > 0) {
                    domain = domain_dict[hostname_parts.join('_')];
                    if (!! domain) return domain;
                    hostname_parts = hostname_parts.slice(1); // cut off the head and continue
                }
                // fallback, domain is set to 'none'
                return domain;
            })(window.location.hostname, (!! ed.siteConfig) ? ed.siteConfig.ga_domains : false );
            ga_args.push(['_setDomainName', ((ga_domain === 'none') ? '' : '.') + ga_domain]);

            var site_args = ed.gaOptions || ((!! (ed.siteConfig && ed.siteConfig.ga_options)) ? ed.siteConfig.ga_options : []);

            // Our custom variables, some of which aren't currently being populated properly (timing, build_dt)
            var ga_final = [
                ['_setCustomVar', 1, 'loadTime', '' + loadTime],
                ['_setCustomVar', 2, 't', template],
                ['_setCustomVar', 3, 'build_dt', buildDate],
                ['_setCustomVar', 4, 'mobi', 'y', 1],
                ['_trackPageview'],
                ['_trackPageLoadTime']
            ];

            var ga_args_array = ga_args.concat(site_args, ga_final);
            ga.push.apply(this, ga_args_array);

            var insertAt = document.getElementsByTagName('script')[0] || document.getElementsByTagName('head')[0];
            var isSSL = location.protocol[4] == 's';

            // JB: Would this ever really happen?
            // PM: If clients aren't using GA in their site, yes. (Many ecommerce sites don't use GA.)
            // QA Tracking. Load the QA script if its not already loaded.
            if (!window._gat) {            
                var gaScript = document.createElement('script');
                gaScript.onload = gaScript.onreadystatechange = ga.load;
                gaScript.src = '//' + (isSSL ? 'ssl' : 'www') + '.google-analytics.com/ga.js';
                insertAt.parentNode.insertBefore(gaScript, insertAt);
            } else {
                ga.load();
            }

            // Quantcast Tracking
            var _qevents = window._qevents = window._qevents || [];
            var qcScript = document.createElement('script');
            qcScript.src = '//' + (isSSL ? 'secure' : 'edge') + '.quantserve.com/quant.js';
            insertAt.parentNode.insertBefore(qcScript, insertAt);

            _qevents.push({qacct:"p-eb0xvejp1OUw6"});
        },

        load: function() {
            if (ga.loaded) return;
            ga.loaded = true;
            ga.push.apply(null, ga.q);
            // Don't queue anymore.
            ga.queue = ga.push;
        },

        loaded: false,

        // Queue arguments to be pushed to _gaq on ga.load.
        queue: function() {
            [].push.apply(ga.q, [].slice.call(arguments));
        },

        q: [],

        // Iterates through arguments and pushes them to _gaq. 
        // Replaces null values with gaId.
        push: function() {
            var ed =  Mobify.evaluatedData;
            var args = [].slice.call(arguments);
            _.each(ed.gaId || ((!! (ed.siteConfig && ed.siteConfig.ga_account)) ? [ed.siteConfig.ga_account] : false) || [], function(gaId, i) {
                var prefix = 'MOBIFY' + i;
                _.each(args, function(arg, j) {
                    var data = arg.slice(0);
                    data[0] = prefix + '.' + data[0];
                    if (data[1] === null) data[1] = gaId;
                    _gaq.push(data);
                });
            });
        }
    };
})(Mobify.$, Mobify._);
