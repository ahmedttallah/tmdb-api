FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn

COPY . .

RUN cp .env.example .env

RUN yarn build

EXPOSE 8080

CMD ["node", "dist/main.js"]
