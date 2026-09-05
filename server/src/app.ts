import cors from "cors";
import express from "express";
import sessionRoutes from "./routes/sessionRoutes.js";

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/api/sessions", sessionRoutes);

export default app;

