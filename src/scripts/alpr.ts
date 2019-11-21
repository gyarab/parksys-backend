import { loadImageAndRequest, cutImageUsingLprResponse } from "../apis/lprApi";
import path from "path";

const img = process.argv[2];

(async () => {
  const response = await loadImageAndRequest(img);
  console.log(response.data.results[0].plate);
  await cutImageUsingLprResponse(
    img,
    path.join(process.cwd(), `rect_${response.data.results[0].plate}.jpg`),
    response.data.results[0]
  );
})();
