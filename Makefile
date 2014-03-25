install:
	#git submodule update --init
	npm uninstall -g grunt
	npm install -g grunt-cli bower
	npm install
	bower install
	
test: install
	grunt test

all:
	install
