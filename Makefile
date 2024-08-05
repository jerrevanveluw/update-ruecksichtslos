.PHONY: *

# The first command will be invoked with `make` only and should be `build`
build:
	npm run build

all: update install test build

install:
	npm i

run:
	npm start

test:
	npm test

update:
	npm run update
