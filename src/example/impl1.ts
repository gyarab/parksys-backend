import { Example } from "./interfaces";

class ExampleImpl1 implements Example {
  do(): string {
    return "impl1";
  }
}

export = ExampleImpl1;
