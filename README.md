## Bitburner scripts
This repository contains all the scripts I currently use for bitburner.

## Distributed
These scripts are greate once you start to have some purchased servers. These do the following.
1) Buy servers until you reach the cap
2) Buy new servers with the double the ram if the cap is met
3) Loop through all available hacked servers to get cash from them. (The targeting algorithim is extremly simply)
4) Uses as little ram as possible on the clients to increase thread count

Before running this init needs to be run. Init will generate the list of servers for the server graph.

### Running
```
run init.js foodnstuff
run distributedServer.js
```

## Init
These scripts are basic scripts that are great for the early game. They are designed to use the non purchased servers to attack a single server.

### Running
```
run init.js foodnstuff
```