# Pizzi API

## Install
```sh
> npm install
```

## Run
```sh
> npm start
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

In order to run the test, you will need a running postgres database. You can
find a [compose
file](https://github.com/PizziPayment/PizziBackDeploymentTools/blob/master/docker-compose.yaml)
in the
[PizziBackDeploymentTools](https://github.com/PizziPayment/PizziBackDeploymentTools)
repository to quickly create the database.

```
 git clone git@github.com:PizziPayment/PizziBackDeploymentTools.git
 cd PizziBackDeploymentTools
 docker compose up db -d
 cd -
```

