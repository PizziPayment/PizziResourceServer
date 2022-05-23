# Contributions

The code of the project is stored in the `app` folder. As for the documentation of API's routes, it's stored in
the `documentation` folder and is made thanks to the [OpenAPI specification](https://spec.openapis.org/oas/v3.1.0).

## Application

### `index.ts`

This is where the ORM (powered by [Sequelize](https://sequelize.org)) is configured, this is also what run the API when
you use `yarn start`.

### `api.ts`

This is where the API configuration is loaded.

The routers are also loaded here.

```ts
UserRouter(app)
```

### Architecture

The API source code is divided in domains, that are represented by all the subfolders in the `app` folder. Each of them
except the `common` one represent a resource in the API.

```
domain_name
|-controllers
| |-domain_name.controller.ts
|
|-middlewares
| |-some.middleware.ts
|
|-models
| |-action.request.model.ts
|
|-routes.config.ts
```

The `routes.config.ts` is where the router is stored.

Here's how is defined a router.

```ts
export default function Router(app: Application): void {
  app.post("ROUTE", [MIDDLEWARE, MIDDLEWARE, MIDDLEWARE, ..., CONTROLLER])
}
```

It holds all the endpoints for the domain. Every endpoints can be seen as a unique process.

The `models` are all the object that are used in Input and Output in the process.

The `middlewares` are all the checks that are made before the actual business of the process.

The `controllers` store the business code of the processes, no checks are made in the controllers everything needs to be
checked before.

The `commons` folder is like a normal domain folder except it contains resources that are used across different domains.
For example, the middleware that identifies a user with its token is a common `middleware` because user authentication is
used in many domains.

### Tests

Tests are stored in the `tests` folder, it works basically the same as a domain folder except every file is a test suite
for a specific domain and `commons` is a folder where utility functions are stored.


