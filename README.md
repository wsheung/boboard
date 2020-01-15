# Wormboard
A revival of wormboard - stats tracking for wormhole corporations

## Backend
Wormboard use mongodb as to store KMs

1. Run `yarn install` and `yarn start` to start backend instance. 

2. Currently there are two main backend processes working async-ly
  a. The real time Killmail feed process that pushes new KM into mongodb
  b. The historical KM fetching process that starts running the moment you start backend
    - This process fetches all the KMs in the DB from this month and use distinct corporations in that list to fetch their           historical KM stats.

You can also run mocha unit tests for backend via `yarn test`

## Frontend
You can start local dev instance via

`yarn start`

## Pending tasks

1. Hook up frontend with backend (DONE)
2. Implement fetchHistoricalKMsByCorp backend (DONE)
3. Iterate on frontend design (DONE)
4. Backend should store list of processed km in db, so that historical process don't refetch existing km
5. Frontend needs to be able to build and deploy
6. Dockerize/ automate deployment for backend
