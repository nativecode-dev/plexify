#!/bin/bash

export BRANCH=${CI_COMMIT_REF_NAME}
export DOMAIN="nativecode.net"
export PROJECT="plexify"
export ORGANIZATION="opensource"
export SSH_KEY=${SSH_PRIVATE_KEY}

export EMAIL="automaton+${PROJECT}@nativecode.com"
export GIT_HOST="git.${DOMAIN}"
export SSH_HOST="gitssh.${DOMAIN}"

source .citools/ci-export
