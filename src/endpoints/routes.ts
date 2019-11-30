interface IRoute {
  name: RoutableEndpoints;
  path: string;
}
type RoutableEndpoints =
  | "ping"
  | "login/password"
  | "devices/qr"
  | "devices/activate"
  | "capture";

type RouteConfig = Record<RoutableEndpoints, Omit<IRoute, "name">>;

const config: RouteConfig = {
  ping: { path: "/ping" },
  "login/password": { path: "/login/password" },
  "devices/qr": { path: "/devices/qr/:id" },
  "devices/activate": { path: "/devices/activate" },
  capture: { path: "/capture" }
};

function getRoutes(
  // TODO: Find a way to add types (was RouteConfig)
  routeConfig: any
): Record<RoutableEndpoints, IRoute> {
  return Object.keys(routeConfig)
    .map(key => {
      return {
        name: key,
        path: routeConfig[key].path
      };
    })
    .reduce(
      (a, c) => {
        a[c.name] = c;
        return a;
      },
      {} as any
    );
}

export default getRoutes(config);
