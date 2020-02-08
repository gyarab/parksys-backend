### BUILD
FROM node:13-buster-slim AS build
WORKDIR /usr/src/app

# Installing dependencies first can save time on rebuilds
# We do need the full (dev) dependencies here
COPY package.json package-lock.json ./
RUN npm install
# Then copy in the actual sources we need and build
COPY tsconfig.json ./
COPY src/ ./src/
#COPY test_assets/ ./test_assets/
RUN npm run compile
#RUN npm run test

### DEPS
FROM node:13-buster-slim AS deps
WORKDIR /usr/src/app

# This _only_ builds a runtime node_modules tree.
# We won't need the package.json to actually run the application.
# If you needed developer-oriented tools to do this install they'd
# be isolated to this stage.
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm install --only=prod

### FINAL
FROM node:13-buster-slim
WORKDIR /usr/src/app

COPY src/ ./src
COPY --from=deps /usr/src/app/node_modules ./node_modules/
COPY --from=build /usr/src/app/dist ./dist/
COPY config ./
COPY typings ./

EXPOSE 8080
CMD ["node", "dist/index.js", "-e", "ts"]

