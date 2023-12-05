FROM node:alpine
LABEL maintainer="Daniel Arakcheev"


COPY package*.json ./
COPY ./app ./app
COPY ./tsconfig.json ./

WORKDIR /app

EXPOSE 8000

RUN npm install
