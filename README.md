## ocelot.js

Ocelot is a reliable file transfer tool

* it can reliably transfer large files
* it transfers the file as smaller chunks over HTTP
* broken chunks are refetched until integrity is achieved
* upon achieving integrity, the chunks are reassembled into the final
  file
* it's written entirely in Javascript and can be extended easily to add
  features such as notifications
* it uses WebSockets for control and HTTP GET for transfers
* it has a nice user interface powered by semantic-ui

# Usage

Self-contained executables are coming soon; until then you need
node-webkit

## node-webkit

Prebuilt binaries (v0.9.0-rc1 - Jan 28, 2014):

* Linux: [32bit](https://s3.amazonaws.com/node-webkit/v0.9.0-rc1/node-webkit-v0.9.0-rc1-linux-ia32.tar.gz) / [64bit] (https://s3.amazonaws.com/node-webkit/v0.9.0-rc1/node-webkit-v0.9.0-rc1-linux-x64.tar.gz)
* Windows: [win32](https://s3.amazonaws.com/node-webkit/v0.9.0-rc1/node-webkit-v0.9.0-rc1-win-ia32.zip)
* Mac: [32bit, 10.7+](https://s3.amazonaws.com/node-webkit/v0.9.0-rc1/node-webkit-v0.9.0-rc1-osx-ia32.zip)
