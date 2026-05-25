import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../../types";

const router = Router();

router.post(
  "/",
  auth(USER_ROLE.contributor, USER_ROLE.maintainer),
  issuesController.createIssues,
);

router.get("/", issuesController.getIssue);

router.get("/:id", issuesController.getIssueById);

router.patch(
  "/:id",
  auth(USER_ROLE.contributor, USER_ROLE.maintainer),
  issuesController.updateIssue,
);

router.delete(
  "/:id",
  auth(USER_ROLE.maintainer),
  issuesController.deleteIssue,
);

export const issuesRouter = router;
