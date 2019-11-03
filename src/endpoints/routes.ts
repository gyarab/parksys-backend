interface IRoute {
  name: RoutableEndpoints;
  path: string;
}
type RoutableEndpoints = "ping" | "login/password";

type RouteConfig = Record<RoutableEndpoints, Omit<IRoute, "name">>;

const config: RouteConfig = {
  ping: { path: "/ping" },
  "login/password": { path: "/login/password" }
};

function getRoutes(
  routeConfig: RouteConfig
): Record<RoutableEndpoints, IRoute> {
  return Object.keys(routeConfig)
    .map(key => ({
      name: key,
      path: routeConfig[key].path
    }))
    .reduce(
      (a, c) => {
        a[c.name] = c;
        return a;
      },
      {} as any
    );
}

export default getRoutes(config);
