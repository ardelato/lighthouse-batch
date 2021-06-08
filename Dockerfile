FROM node:14-alpine

WORKDIR /app

RUN apk --update-cache --no-cache add chromium

COPY ./package.json .

RUN npm install

COPY . .

CMD "/bin/sh"