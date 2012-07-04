install:
	git submodule update --init
	npm install

test:
	./tests/runner.sh

jenkins:
	./tests/runner.sh

all:
	install