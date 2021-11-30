#!/usr/bin/env sh

touch .yarnrc
echo "https://pointecouteau.fr:40403/" >> .yarnrc

touch .npmrc
echo "https://pointecouteau.fr:40403/" >> .npmrc
echo "@pizzi-db:registry=https://pointecouteau.fr:40403/" >> .npmrc
echo "//pointecouteau.fr:40403/:_authToken=\"${VERDACIO_TOKEN}\"" >> .npmrc
echo "//pointecouteau.fr:40403/:always-auth=true" >> .npmrc
echo "always-auth=true" >> .npmrc
