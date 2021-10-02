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
