.PHONY: *

# The first command will be invoked with `make` only and should be `build`
build:
	npm run build

test:
	npm test

run:
	npm start

update:
	npm run update
