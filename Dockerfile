FROM node:14-alpine

WORKDIR /app

RUN apk --update-cache --no-cache add chromium

COPY . .

RUN npm install

ENTRYPOINT node run.js -f sites.txt -v -t 5