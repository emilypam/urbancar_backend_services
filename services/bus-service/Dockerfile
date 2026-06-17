FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

RUN chown -R node:node /app
USER node

EXPOSE 3007

CMD ["node", "dist/server.js"]
