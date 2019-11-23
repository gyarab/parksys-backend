import config from "../../config";
import { LicensePlateRecognition } from "./types";
import ExpressOpenAlpr from "./expressOpenAlpr";

const impls: { [key: string]: (config) => LicensePlateRecognition } = {
  expressOpenAlpr: config => {
    return new ExpressOpenAlpr(config);
  }
};

const localConfig = config.get("impls:apis:lpr");
const key = localConfig["i"];
export default impls[key](localConfig[key]);
