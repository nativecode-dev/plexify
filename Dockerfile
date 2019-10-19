# STAGE: Base Image
#------------------------------------------------------------------------------
FROM node:8-jessie-slim AS BASE
LABEL MAINTAINER opensource@nativecode.com
ENV DEBIAN_FRONTEND noninteractive
WORKDIR /app
COPY /package-lock.json /app/package-lock.json
COPY /package.json /app/package.json
RUN set -ex \
  && apt-get update \
  && apt-get -qq install -y handbrake-cli mediainfo \
  && npm install -g pm2 \
  && npm install --production \
  ;

# STAGE: Build
#------------------------------------------------------------------------------
FROM BASE as BUILD
WORKDIR /build
# Copy required configuration
COPY /.prettierrc /build/.prettierrc
COPY /package-lock.json /build/package-lock.json
COPY /package.json /build/package.json
COPY /tasks.json /build/tasks.json
COPY /tsconfig.json /build/tsconfig.json
COPY /tslint.json /build/tslint.json
# Copy source
COPY /src /build/src
COPY /types /build/types
RUN set -ex \
  && npm install \
  && npm run build \
  ;

# STAGE: Final
#------------------------------------------------------------------------------
FROM BASE
ENV DEBUG "plexify:*,-plexify:*:debug,-plexify:*:trace"
ENV PLEXIFY_RENAME "false"
ENV PLEXIFY_DRYRUN "true"
ENV PLEXIFY_MOUNT "/mnt/media"
ENV PLEXIFY_REDIS_HOST "redis"
ENV PLEXIFY_REDIS_PORT "6379"
WORKDIR /app
COPY --from=BUILD /build/bin /app
COPY /docker-entry.sh /app/docker-entry.sh
RUN set -ex \
  && chmod +x /app/docker-entry.sh \
  && mkdir /root/.plexify \
  && mkdir /mnt/media \
  && which HandBrakeCLI \
  && which mediainfo \
  && which node \
  && which pm2 \
  ;
VOLUME /mnt/media
CMD ["/app/docker-entry.sh"]
