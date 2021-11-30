#!/usr/bin/env sh

touch .yarnrc
echo "https://pointecouteau.fr:40403/" >> .yarnrc

echo "//pointecouteau.fr:40403/:_authToken=\"${NODE_AUTH_TOKEN}\"" >> .npmrc
