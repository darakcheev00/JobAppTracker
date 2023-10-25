FROM node:alpine
LABEL maintainer="Daniel"

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY ./public ./public
COPY ./src ./src
COPY tsconfig.json ./

RUN npm run build


