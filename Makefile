install:
	npm install

test:
	tests/runner.sh

jenkins:
	tests/runner.sh | grep '<*>' | tee report.xml

all:
	install