# STAGE: Base Image
#------------------------------------------------------------------------------
FROM node:8-alpine AS BASE
LABEL MAINTAINER=opensource@nativecode.com
COPY package-lock.json /app/package-lock.json
COPY package.json /app/package.json
WORKDIR /app
RUN set -ex \
  && npm install --production \
  ;

# STAGE: Build
#------------------------------------------------------------------------------
FROM BASE
COPY package-lock.json /build/package-lock.json
COPY package.json /build/package.json
COPY tsconfig.json /build/tsconfig.json
COPY tslint.json /build/tslint.json
RUN set -ex \
  && npm install \
  && npm run build \
  ;

# STAGE: Final
#------------------------------------------------------------------------------
FROM BASE
COPY --from=BUILD /build/dist /app/dist
VOLUME /mnt/media
CMD [/bin/node /app/dist/plexify.js]
