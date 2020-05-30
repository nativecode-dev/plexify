FROM node:12-alpine as BASE
WORKDIR /app
COPY /package-lock.json /app
COPY /package.json /app
RUN set -e \
  && apk --update --no-cache add bash curl git grep jq \
  && npm install --production \
  ;



# -----------------------------------------------------------------------------
# BUILD STAGE
# -----------------------------------------------------------------------------
FROM BASE as BUILD
WORKDIR /build
COPY --from=BASE /app/node_modules /build/node_modules
COPY /src /build/src
COPY /.editorconfig /build
COPY /.gitattributes /build
COPY /.gitignore /build
COPY /.gitmodules /build
COPY /.npmignore /build
COPY /.prettierrc /build
COPY /LICENSE /build
COPY /README.md /build
COPY /package-lock.json /build
COPY /package.json /build
COPY /tasks.json /build/tasks.json
COPY /tsconfig.json /build/tsconfig.json
COPY /tslint.json /build/tslint.json

SHELL ["/bin/bash", "-c"]

RUN set -e \
  && npm install -g lerna \
  && npm install \
  && npm run build \
  ;



# -----------------------------------------------------------------------------
# FINAL STAGE
# -----------------------------------------------------------------------------
FROM BASE as FINAL
COPY --from=BUILD /build/bin /bin/plexify
WORKDIR /media
VOLUME /media

ENTRYPOINT [ "/usr/local/bin/node", "/bin/plexify/index.js" ]
