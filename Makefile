install:
	#git submodule update --init
	npm uninstall -g grunt
	npm install -g grunt-cli
	npm install

test: install
	grunt test

all:
	install

modules:
	cd www/static/modules ; \
	zip -r ../downloads/modules.zip carousel accordion zoomable ; \
	zip -r ../downloads/carousel.zip carousel; \
	zip -r ../downloads/accordion.zip accordion; \
	zip -r ../downloads/zoomable.zip zoomable

.PHONY: modules
