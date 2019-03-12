# STAGE: Base Image
#------------------------------------------------------------------------------
FROM xataz/alpine:edge AS BASE
LABEL MAINTAINER=opensource@nativecode.com
ENV DEBIAN_FRONTEND=noninteractive
RUN set -ex \
  && apk add --no-cache handbrake mediainfo nodejs nodejs-npm \
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
  && which HandBrakeCLI \
  && which mediainfo \
  ;
VOLUME /root/.plexify
VOLUME /mnt/media
CMD ["/usr/local/bin/node", "plexify.js"]
