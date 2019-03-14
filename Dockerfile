# STAGE: Base Image
#------------------------------------------------------------------------------
FROM node:8-jessie-slim AS BASE
LABEL MAINTAINER=opensource@nativecode.com
ENV DEBIAN_FRONTEND=noninteractive
RUN set -ex \
  && apt-get update \
  && apt-get install -y handbrake-cli mediainfo \
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
ENV PLEXIFY_DELETE="false"
ENV PLEXIFY_DRYRUN="true"
ENV PLEXIFY_MOUNT_POINT="/mnt/media"
ENV PLEXIFY_REDIS_HOST="redis"
ENV PLEXIFY_REDIS_PORT="6379"
COPY --from=BUILD /build/dist /app
WORKDIR /app
RUN set -ex \
  && mkdir /root/.plexify \
  && mkdir /mnt/media \
  && which HandBrakeCLI \
  && which mediainfo \
  && which node \
  ;
VOLUME /root/.plexify
VOLUME /mnt/media
CMD ["/usr/local/bin/node", "plexify.js"]
