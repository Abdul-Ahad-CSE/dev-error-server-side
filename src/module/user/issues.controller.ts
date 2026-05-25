import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import type { IIssues } from "./issues.interface";
import { error } from "node:console";

const createIssues = async (req: Request, res: Response) => {
  //console.log(req.body);
  //const { name, email, password, age } = req.body;
  const reporter = req.user; //This user is verified via email that it exist on our database from auth.ts
  if (!reporter) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      errors: "No reporter found",
    });
  }


  //console.log("reporter from controller",reporter);
  //The reporter_id is extracted from the decoded JWT (req.user.id), not from the request body.

  try {
    const result = await issuesService.createIssuesIntoDB(
      req.body,
      reporter.id as number,
    );

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

const getIssue = async (req: Request, res: Response) => {
  try {
    const result = await issuesService.getIssueFromDB();
    res.status(200).json({
      success: true,
      message: "Issues retrived successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

const getIssueById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // 1. Validate id
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue id",
        data: {},
      });
    }

    const result = await issuesService.getIssueFromDBById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Issue not found!",
        data: {},
      });
    }

    return res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: {},
    });
  }
};

const updateIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  const reporter = req.user; //This user is verified via email that it exist on our database from auth.ts

  try {
    // 1. Validate id
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue id",
        errors: "The id you are searching is not in the list",
      });
    }

    // 2. Get issue first
    const existingIssue = await issuesService.getIssueFromDBById(id);

    if (!existingIssue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found!",
        errors: "The issues you are searching is not in the list",
      });
    }
    if (!reporter) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: "sorry, reporter not found",
      });
    }


    // 3. Authorization
    const isMaintainer = reporter.role === "maintainer";
    const isOwner = Number(reporter.id) === Number(existingIssue.reporter.id);
    const isOpen = existingIssue.status === "open";

    // Contributors can only update own open issues
    if (!isMaintainer) {
      if (!isOwner || !isOpen) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden: Contributors can only update their own open issues",
        });
      }
    }

    // 4. Update
    const result = await issuesService.updateIssueInDB(req.body, id);

    return res.status(200).json({
      success: true,
      message: "Issue updated successfully!",
      data: result.rows[0],
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

const deleteIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await issuesService.deleteIssueFromDB(id as String);

    console.log(result);
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "User Not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

export const issuesController = {
  createIssues,
  getIssue,
  getIssueById,
  updateIssue,
  deleteIssue,
};











/*
The response from user.controller.ts goes back to the client.

That client can be:

Postman
Browser
React frontend
Mobile app
Any application calling your API

but NOT to the database. 
Client → Backend → Database
Database → Service → Controller → Client
*/
