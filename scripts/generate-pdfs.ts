import path from "node:path";
import { dist, renderPdfs } from "./pdf-renderer.ts";

await renderPdfs(path.join(dist, "downloads"));
