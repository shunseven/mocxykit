import { createMcpServerWithStdio } from "./mcp/mcp";
import { logger } from "./mockProxy/common/log";

createMcpServerWithStdio().catch((error) => {
  logger(error,);
  process.exit(1);

})