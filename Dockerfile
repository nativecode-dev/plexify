# STAGE: Base Image
#------------------------------------------------------------------------------
FROM node:8-alpine AS BASE
LABEL MAINTAINER=opensource@nativecode.com
ENV DEBIAN_FRONTEND=noninteractive
RUN set -ex \
  && sed -i -e 's/v[[:digit:]]\.[[:digit:]]/edge/g' /etc/apk/repositories \
  && apk upgrade --update-cache --available handbrake mediainfo \
  ;

# STAGE: Build
#------------------------------------------------------------------------------
FROM BASE as BUILD
COPY package-lock.json /build/package-lock.json
COPY package.json /build/package.json
COPY tsconfig.json /build/tsconfig.json
COPY tslint.json /build/tslint.json
COPY webpack.config.ts /build/webpack.config.ts
COPY aliases /build/aliases
COPY src /build/src
WORKDIR /build
RUN set -ex \
  && npm install \
  && npm run build \
  ;

# STAGE: Final
#------------------------------------------------------------------------------
FROM BASE
ENV DEBUG=plexify*
ENV PLEXIFY_MOUNT_POINT="/mnt/media"
ENV PLEXIFY_DRYRUN="true"
COPY --from=BUILD /build/dist /app
WORKDIR /app
RUN set -ex \
  && mkdir /root/.plexify \
  && mkdir /mnt/media \
  ;
VOLUME /root/.plexify
VOLUME /mnt/media
CMD ["/usr/local/bin/node", "plexify.js"]
