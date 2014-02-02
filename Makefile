all: run

clean:
	rm -rf app.nw

bundle: clean
	cd build && zip app.nw -r ./* -x  \
		node_modules/*/test\* \
		node_modules/*/example\* \
		&& mv app.nw .. && cd ..

grunt:
	grunt

run: clean
	grunt
	open app.nw

publish:
	grunt
	scp app.nw strider@strider.critiqueapp.com:~/public-web/ocelot.nw
	echo https://public.strider.critiqueapp.com/ocelot.nw
