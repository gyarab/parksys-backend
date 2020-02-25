import config from "../config";
import * as types from "./types";
import MemoryCache from "./memoryCache";

const impls: { [key: string]: (config) => types.Cache } = {
  memory: _ => {
    return new MemoryCache();
  }
};

const localConfig = config.get("impls:cache");
const key = localConfig["i"];
export default impls[key](localConfig[key]);
