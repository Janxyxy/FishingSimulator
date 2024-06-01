FROM node:latest

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . /app

RUN npm run css

CMD ["node", "server.js"]