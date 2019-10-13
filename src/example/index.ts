import config from "../config";
import ExampleImpl1 from "./impl1";
import ExampleImpl2 from "./impl2";

interface Example {
  do(): string;
}

const impls: { [key: string]: () => Example } = {
  impl1: () => new ExampleImpl1(),
  impl2: () => new ExampleImpl2()
};

export = impls[config.get("impls:example")]();
