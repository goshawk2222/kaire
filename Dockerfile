FROM node:10.15.0

WORKDIR /app

ADD package.json /app/package.json
RUN npm install

ADD . /app

ENV NODE_ENV='production'
ENV LOG_LEVEL='error'

ENV APP_ID E62j8STIcM
ENV MASTER_KEY Rpg9bv8jiL
ENV PUBLIC_SERVER_URL https://admin.chiesadisassari.it/parse
ENV APP_NAME Kaire
ENV MAILGUN_API_KEY key-004454825826125a446123cf1ca7d3c3
ENV MAILGUN_DOMAIN quanlabs.com
ENV MAILGUN_FROM_ADDRESS dev@quanlabs.com
ENV MAILGUN_TO_ADDRESS info@quanlabs.com

ENV PARSE_DASHBOARD_USER='admin'
ENV PARSE_DASHBOARD_PASS='$2y$12$FjjhORnNdorLBNbkhVTP0e..HwP3fRKov9wYmo.2mGsJ4y96AviZm'
