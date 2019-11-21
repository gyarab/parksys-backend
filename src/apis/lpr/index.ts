import config from "../../config";
import { LicensePlateRecognition } from "./types";
import ExpressOpenAlpr from "./expressOpenAlpr";

const impls: { [key: string]: () => LicensePlateRecognition } = {
  expressOpenAlpr: () => new ExpressOpenAlpr()
};

export default impls[config.get("impls:apis:lpr:i")]();
