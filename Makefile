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
	cd modules; zip -r ../../../modules.zip carousel accordion zoomable; \
	zip -r ../../../carousel.zip carousel; \
	zip -r ../../../accordion.zip accordion; \
	zip -r ../../../zoomable.zip zoomable
