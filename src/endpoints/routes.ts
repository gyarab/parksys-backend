interface IRoute {
  name: RoutableEndpoints;
  path: string;
}

type RoutableEndpoints =
  | "ping"
  | "login/password"
  | "login/passwordChange"
  | "devices/qr"
  | "devices/activate"
  | "devices/capture"
  | "devices/config"
  | "captureImage";

type RouteConfig = Record<RoutableEndpoints, Omit<IRoute, "name">>;

const config: RouteConfig = {
  ping: { path: "/ping" },
  "login/password": { path: "/login/password" },
  "login/passwordChange": { path: "/login/password" },
  "devices/capture": { path: "/capture" },
  "devices/qr": { path: "/devices/qr/:id" },
  "devices/config": { path: "/devices/config" },
  "devices/activate": { path: "/devices/activate" },
  captureImage: { path: "/captureImage/:id" }
};

function getRoutes(
  routeConfig: RouteConfig
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
