FROM node:latest

RUN mkdir app

ADD . /app
WORKDIR /app
RUN npm install

# ENV APP_ID setYourAppId
# ENV MASTER_KEY setYourMasterKey
# ENV DATABASE_URI setMongoDBURI
ENV SERVER_URL http://myeventapp.quanlabs.com/parse
ENV PUBLIC_SERVER_URL http://myeventapp.quanlabs.com/parse
ENV APP_NAME My Event App
ENV MAILGUN_API_KEY key-004454825826125a446123cf1ca7d3c3
ENV MAILGUN_DOMAIN quanlabs.com
ENV MAILGUN_FROM_ADDRESS dev@quanlabs.com
ENV MAILGUN_TO_ADDRESS info@quanlabs.com

# Optional (default : 'parse/cloud/main.js')
# ENV CLOUD_CODE_MAIN cloudCodePath

# Optional (default : '/parse')
# ENV PARSE_MOUNT mountPath

# EXPOSE 1337

# Uncomment if you want to access cloud code outside of your container
# A main.js file must be present, if not Parse will not start

# VOLUME /parse/cloud

CMD [ "npm", "start" ]
