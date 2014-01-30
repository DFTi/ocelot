all: bundle

bundle: clean
	zip app.nw -r ./* -x ./.git\* \
		test\* \
		node_modules/*/test\* \
		node_modules/*/example\* \
		node_modules/sinon\* \
		node_modules/mocha\* \
		node_modules/grunt\* \
		node_modules/chai\* \
		node_modules/sinon-chai\*

run: bundle
	open app.nw

clean:
	rm -rf app.nw

publish: bundle
	scp app.nw strider@strider.critiqueapp.com:~/public-web/ocelot.nw
	echo https://public.strider.critiqueapp.com/ocelot.nw
