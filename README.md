# Backend of Parking System

## Setup

```bash
# Install dependencies
npm install
# Compile
npm run compile
# Start with hot reload
npm run dev:watch
```


## Scripts

**sdev.sh** starts the recognition server (it expects it to be in *../express-openalpr-server*),
compiles Typescript and starts the development server with hot reload -- changes to code
are automatically compiled and the server is relaunched. It uses Docker to start a mongodb instance
using the scripts in *./scripts*. It is necessary to run

```bash
# Arguments are not required, defaule name is mongo, default port map is 27017
# The default values can be changed in ./scripts/config.sh
npm run dbSetup [container name, port mapping]
# OR
bash ./scripts/setup-mongo.sh [container name, port mapping]
```
