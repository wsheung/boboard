# BoBoard
A revival of wormboard - stats tracking page for wormhole kills by wormhole corporations

#See Wiki for installation instructions

## Backend development
boboard use mongodb as to store KMs

Run `yarn install` and `yarn dev` to start backend development instance. You might beed to modify the scripts in package.json for your local environment

You can also run mocha unit tests for backend on linux machines via `yarn test`

Keep in mind that MacOS catalina no longer allows for root directory write, so do
`yarn devMacCatalina` and `yarn testMacCatalina` if you're on said environment

## Frontend development
You can start local dev instance via

`yarn start`

Build via 

`yarn build`

## Pending tasks

1. Hook up frontend with backend (DONE)
2. Implement fetchHistoricalKMsByCorp backend (DONE)
3. Iterate on frontend design (DONE)
4. Backend should store list of processed km in db, so that historical process don't refetch existing km (DONE)
5. Frontend needs to be able to build and deploy (DONE)
6. Dockerize/ automate deployment for backend (WIP)
