install:
	npm install

test:
	./tests/runner.sh

jenkins:
	./tests/runner.sh

all:
	install