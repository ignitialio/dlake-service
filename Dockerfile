FROM node:12-alpine

RUN mkdir -p /opt && mkdir -p /opt/dlake

ADD . /opt/dlake

WORKDIR /opt/dlake

RUN mv vue.config.js.prod vue.config.js

RUN npm install && npm run build

CMD ["node", "index.js"]
