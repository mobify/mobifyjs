#!/bin/bash
serve . &
PID=$!
phantomjs tests/phantom.js
kill $PID