FROM node:10

WORKDIR /usr/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run compile

EXPOSE 8080

CMD ["node", "dist/index.js", "-e", "ts"]
