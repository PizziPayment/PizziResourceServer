# Pizzi API

## Prerequisites

### Setup the access to the private repositories

To access the internal dependencies, you need to set up ssh keys to access Pizzi's github repositories.

### Install dependencies

```bash
yarn install
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
```

## API Configuration

The API can be configured through the environment or config files. Environment variables override config files values.

Config files must be inside the `config` folder.

- `custom-environment-variables.json` maps the environment variable names into the configuration structure.
- `default.json` defines default value.

Other config file can be added if needed,
[see](https://github.com/lorenwest/node-config/wiki/Configuration-Files)

## Running tests

- Go through
  the [first step of the Setup database](https://github.com/PizziPayment/PizziResourceServer/blob/master/README.md#creating-and-launching-the-database)
  if you haven't.

```bash
yarn run test
```
