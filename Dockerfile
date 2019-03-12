# STAGE: Base Image
#------------------------------------------------------------------------------
FROM node:8-slim AS BASE
LABEL MAINTAINER=opensource@nativecode.com
ENV DEBIAN_FRONTEND=noninteractive
ENV DEBUG=plexify
RUN set -ex \
  && apt-get update \
  && apt-get install handbrake-cli mediainfo -y \
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
  && npm run build \
  ;

# STAGE: Final
#------------------------------------------------------------------------------
FROM BASE
COPY --from=BUILD /build/dist /app
ENV PLEXIFY_MOUNT_POINT="/mnt/media"
ENV PLEXIFY_DRYRUN="true"
WORKDIR /app
RUN set -ex \
  && mkdir /root/.plexify \
  && mkdir /mnt/media \
  ;
VOLUME /mnt/media
CMD ["/usr/local/bin/node", "/app/dist/plexify.js"]
