import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { pool } from "./db";
import { issuesRouter } from "./module/user/issues.route";
import { authRoute } from "./module/auth/auth.route";
import logger from "./middleware/logger";

const app: Application = express();
app.use(express.json());
app.use(logger);

app.get("/", (req: Request, res: Response) => {
  //res.send("Hello World!");
  res.status(200).json({
    message: "Express Server",
    author: "DevError",
  });
});

app.use("/api/issues", issuesRouter);
app.use("/api/auth",authRoute);
export default app;
