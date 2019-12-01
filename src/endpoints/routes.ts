interface IRoute {
  name: RoutableEndpoints;
  path: string;
}

type RoutableEndpoints =
  | "ping"
  | "login/password"
  | "devices/qr"
  | "devices/activate"
  | "devices/capture"
  | "devices/config";

type RouteConfig = Record<RoutableEndpoints, Omit<IRoute, "name">>;

const config: RouteConfig = {
  ping: { path: "/ping" },
  "login/password": { path: "/login/password" },
  "devices/capture": { path: "/capture" },
  "devices/qr": { path: "/devices/qr/:id" },
  "devices/config": { path: "/devices/config" },
  "devices/activate": { path: "/devices/activate" }
};

function getRoutes(
  // TODO: Find a way to add types (was RouteConfig)
  routeConfig: any
): Record<RoutableEndpoints, IRoute> {
  return Object.keys(routeConfig)
    .map(key => {
      return {
        name: key,
        ...routeConfig[key]
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
