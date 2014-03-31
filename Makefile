install:
	git submodule update --init
	npm install

test:
	grunt test

all:
	install

modules:
	cd www/static/modules ; \
	zip -r ../downloads/modules.zip carousel accordion zoomable ; \
	zip -r ../downloads/carousel.zip carousel; \
	zip -r ../downloads/accordion.zip accordion; \
	zip -r ../downloads/zoomable.zip zoomable

buildstatic: modules ; \
	cd www ; \
	jekyll ; \
	rm static/downloads/*

serve:
	cd www ; \
	jekyll --server --auto

.PHONY: modules
