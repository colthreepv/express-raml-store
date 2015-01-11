FROM node:0.10.35
MAINTAINER Arthur <arthur_tsang@hotmail.com>

Add . /usr/src/myapp

RUN cd /usr/src/myapp; npm install

EXPOSE 3000

WORKDIR /usr/src/myapp

CMD ["npm", "start"]


