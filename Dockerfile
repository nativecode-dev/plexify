# STAGE: Base Image
#------------------------------------------------------------------------------
FROM node:8-slim AS BASE
ENV DEBIAN_FRONTEND=noninteractive
LABEL MAINTAINER=opensource@nativecode.com
COPY package-lock.json /app/package-lock.json
COPY package.json /app/package.json
WORKDIR /app
RUN set -ex \
  && apt-get update \
  && apt-get install handbrake-cli mediainfo -y \
  && npm install --production \
  ;

# STAGE: Build
#------------------------------------------------------------------------------
FROM BASE as BUILD
COPY package-lock.json /build/package-lock.json
COPY package.json /build/package.json
COPY tsconfig.json /build/tsconfig.json
COPY tslint.json /build/tslint.json
COPY src /build/src
WORKDIR /build
RUN set -ex \
  && npm install \
  && npm run build-prod \
  ;

# STAGE: Final
#------------------------------------------------------------------------------
FROM BASE
COPY --from=BUILD /build/dist /app/dist
ENV PLEXIFY_MOUNT_POINT="/mnt/media"
ENV PLEXIFY_DRYRUN="true"
WORKDIR /app
RUN set -ex \
  && mkdir /root/.plexify \
  && mkdir /mnt/media \
  ;
VOLUME /root/config
VOLUME /mnt/media
CMD ["/usr/local/bin/node", "/app/dist/plexify.js"]
