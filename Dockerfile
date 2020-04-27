FROM node:12-stretch-slim as BUILD

WORKDIR /build

COPY /src /build/src
COPY /.prettierrc /build/
COPY /package-lock.json /build/package-lock.json
COPY /package.json /build/package.json
COPY /tasks.json /build/tasks.json
COPY /tsconfig.json /build/tsconfig.json
COPY /tslint.json /build/tslint.json

SHELL ["/bin/bash", "-c"]

RUN set -e \
  && npm install \
  && npm run build \
  ;



# -----------------------------------------------------------------------------
# FINAL STAGE
# -----------------------------------------------------------------------------
FROM nativecode/ffmpeg-cuda:latest as FINAL

COPY --from=BUILD /build/dist/linux/plexify /bin/plexify

RUN chmod +x /bin/plexify

SHELL ["/bin/bash", "-c"]

ENTRYPOINT [ "/bin/plexify" ]
