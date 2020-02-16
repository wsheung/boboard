# BoBoard
A revival of wormboard - stats tracking page for wormhole kills by wormhole corporations

See [Wiki](https://github.com/wsheung/boboard/wiki) for installation instructions

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
1. Store rank in backend for each month and refresh change in rank every week(?)
2. (Frontend only) displaying active pilot names on row dropdown
3. Calculating average gang size for each corp
