# Wormboard
A revival of wormboard - stats tracking for wormhole corporations

## Backend
Wormboard use mongodb as to store KMs

1. Run `mongod` to start mongodb instance. 
  (`yarn add mongodb` to install if you don't have it)

2. Currently you can start the realtime KM pulling function in backend directory via

`node mongoose.js`

You can also run mocha unit tests for backend via

`yarn test`

## Frontend
You can start local dev instance via

`yarn start`


## Pending tasks (ranked by importance)

1. Hook up frontend with backend
2. Implement fetchHistoricalKMsByCorp backend
3. Iterate on frontend design
