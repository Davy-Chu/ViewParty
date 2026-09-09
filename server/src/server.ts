import { createServer } from "node:http";
import app from "./app.js";
import { configureSessionSocket } from "./sockets/sessionSocket.js";

const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const httpServer = createServer(app);

configureSessionSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`ViewParty server is running at http://localhost:${port}`);
});
