#!/bin/bash

pm2-runtime --raw --watch /app/plexify.js -- convert ${PLEXIFY_MOUNT}
