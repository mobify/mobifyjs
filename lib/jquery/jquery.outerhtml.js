(function($) {
	$.support.outerHTML = !!$(document.createElement('div'))[0].outerHTML;
	
    $.fn.outerHTML = (function() {
		var outerHTMLforTextNodes = function() {
			var outerHTML = (this && this.outerHTML) || '';

			if (this && (this.nodeType == window.Node.TEXT_NODE)) {
				outerHTML = this.nodeValue || '';
			}
			return outerHTML;
		}

        // TODO: TEST ME.
		return $.support.outerHTML ?
			function() {
				return [].join.call(this.map(outerHTMLforTextNodes), '');
			} :
			function() {
				var $wrap = $(document.createElement('div'))
				  , $nodes = $(this).filter(function() {
                        return this && this.nodeType;
                    })

				$nodes.each(function() {
					$wrap.append($(this).clone()[0]);
				});

				return $wrap.html();
			};
	})();
})(Mobify.$);
