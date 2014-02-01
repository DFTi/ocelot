all: bundle

bundle: clean
	grunt
	cd build && zip app.nw -r ./* -x  \
		node_modules/*/test\* \
		node_modules/*/example\* \
		&& mv app.nw .. && cd ..

run: bundle
	open app.nw

clean:
	rm -rf app.nw

publish: bundle
	scp app.nw strider@strider.critiqueapp.com:~/public-web/ocelot.nw
	echo https://public.strider.critiqueapp.com/ocelot.nw
