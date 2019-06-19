FROM node:12-alpine

RUN mkdir -p /opt && mkdir -p /opt/dlake

ADD . /opt/dlake

WORKDIR /opt/dlake

RUN npm install

CMD ["node", "./server/index.js"]
