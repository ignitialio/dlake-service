# dlake: Ignitial.io service

> WARNING!
> only Mongo is available for now as database engine. Couch is WIP

Provides role based access controlled database access for IgnitialIO web apps.

## Work with the repository

The following _npm run_ targets are available:  
- _client:serve_: serves client source code through webpack dev server
- _client:build_: builds service client source code (using webpack)
- _server:start_: starts service server side
- _dev:standalone_: runs service without Docker container
- _dev:start_: starts production service container (uses local source code, not
  image's one)
- _dev:stop_: stops and cleans up development service container
- _prod:start_: starts production service container
- _prod:stop_: stops and cleans up production service container
- _docker:build_: builds Docker image for the service
- _docker:publish:private_: publishes Docker image to an eventually private Docker registry (_registry.gitlab.com_
  is private: you must change this, unless we gave you an access to it)  
- _docker:publish:public_: publishes Docker image to Docker Hub registry (_ignitial/_
  means that this uses _ignitial_: you must change this, unless we gave you an access to it)

## Develop

Add server files in the _server_ folder and client ones in _src_.

You can add any dependency thanks to _npm_. The only constraint is to have
dependencies that work with webpack, if used client side.

## Use

Build service image and deploy it in the context of your need (web application
  deploy, in this case).

## Testing

You need first to populate the database in order to run the test:

```bash
npm run populate:mongo
npm run test:mongo
```

Currently only mongo option is tested and operational. Others DB engines including CouchDB will
be available in the future.

In the coming versions it will be possible to test the service within a web app context
thanks to _@ignitial/iios-app-client_ and _@ignitial/iios-app-server_ libs.
