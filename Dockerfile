FROM node:24.22.1-bookworm-slim

WORKDIR /app

COPY package*.json /app

RUN npm install && npm cache clean --force

COPY . /app

# Build CSS with tailwind, then drop dev dependencies
RUN npm run css && npm prune --omit=dev

CMD ["node", "server.js"]
