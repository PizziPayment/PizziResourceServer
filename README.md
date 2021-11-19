# Pizzi API

## Prerequisites

### Setup the access to the private registery
 - Go to the [private npm registry](https://pointecouteau.fr:40403/)
 - Login with github
 - Click on the info button
 - Follow the instructions for your package manager
 - Prey for it to work

### Install dependencies
```bash
yarn install
# or
npm install
```

### Setup the database

#### Creating and launching the database
 ```bash
 git clone git@github.com:PizziPayment/PizziBackDeploymentTools.git
 cd PizziBackDeploymentTools
 docker compose up db -d
 cd -
 ```

#### Running migration
```bash
git clone git@ggithub.com/PizziPayment/PizziAPIDB.git
cd PizziAPIDB/deploy
yarn install
yarn start table recreate
cd -
```

## Run the API
You should now be able to launch the resource server:
```bash
yarn run start
# or
npm run start
```

## API Configuration

The API can be configured through the environment or config files. Environment
variables override config files values.

Config files must be inside the `config` folder.
- `custom-environment-variables.json` maps the environment variable
  names into the configuration structure. 
- `default.json` defines default value.

Other config file can be added if needed,
[see](https://github.com/lorenwest/node-config/wiki/Configuration-Files)

## Running tests

- Go through the [first step of the Setup
  database](https://github.com/PizziPayment/PizziResourceServer/blob/master/README.md#creating-and-launching-the-database)
  if you haven't.

```bash
yarn run test
# or
npm run test
```
