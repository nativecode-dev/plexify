FROM node:12-alpine

WORKDIR /app

COPY /bin /app/bin
COPY /package-lock.json /app
COPY /package.json /app

ENV DEBUG *

RUN set -e \
  && apk --update --no-cache add bash curl ffmpeg git grep jq \
  && npm ci --production \
  && mkdir -p /app/media \
  ;

VOLUME /app/media

ENTRYPOINT [ "/usr/local/bin/node", "/bin/plexify/index.js" ]
