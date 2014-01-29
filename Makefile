all: bundle

bundle: clean
	zip app.nw -r ./*

run: bundle
	open app.nw

clean:
	rm -rf app.nw

publish: bundle
	scp app.nw strider@strider.critiqueapp.com:~/public-web/ocelot.nw
	echo https://public.strider.critiqueapp.com/ocelot.nw
