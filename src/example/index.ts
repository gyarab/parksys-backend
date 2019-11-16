import config from "../config";
import { Example } from "./interfaces";
import ExampleImpl1 from "./impl1";
import ExampleImpl2 from "./impl2";

const impls: { [key: string]: () => Example } = {
  impl1: () => new ExampleImpl1(),
  impl2: () => new ExampleImpl2()
};

export default impls[config.get("impls:example")]();
