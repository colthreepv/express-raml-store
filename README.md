# RAML Store

fork [raml-store](https://github.com/brianmc/raml-store).  but instead of saving to mongodb, it saves to the filesystem directly.  

## Configuration

process.env.RAML_PORT=3000
process.env.RAML_DATAPATH=.

## To use

node server.js

assuming RAML_PORT is set to 3000 and RAML_DATAPATH is set to /var/raml, access http://localhost:3000, all files in /var/raml will be listed in the designer.

## Running docker container

docker run -d --name raml-store 
	-e "RAML_DATAPATH=/var/raml" 
	-v /var/raml:/var/raml 
	-p 3000:3000 
	arthurtsang/raml-store

assuming you've checked out your RAML files to /var/raml from your git repo.

## Reason doing this

instead of keeping the RAML files in a database, I'd like to keep them in github so we can perform code review without worrying about permission, merging,...

## Disclaimer

the code to walk the directory is basically copied from [stackoverflow](http://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search)

[hadesbox's fork](https://github.com/hadesbox/raml-api-designer-store) of raml-store also helps a lot

