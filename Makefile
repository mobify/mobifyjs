install:
	git submodule update --init
	npm install

test:
	./tests/runner.sh

jenkins:
	./tests/runner.sh

all:
	install


module:
	zip -r www/static/downloads/modules.zip modules
	zip -r www/static/downloads/accordion.zip modules/accordion
	zip -r www/static/downloads/carousel.zip modules/carousel
	zip -r www/static/downloads/zoomable.zip modules/zoomable
	cp modules/**/*.js www/static/examples/js/
	cp modules/**/*.css www/static/examples/css/
