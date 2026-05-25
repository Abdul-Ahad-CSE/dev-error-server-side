import { pool } from "../../db";
import logger from "../../middleware/logger";
import type { IIssues } from "./issues.interface";
import bcrypt from "bcryptjs";

const createIssuesIntoDB = async (payLoad: IIssues, reporter_id: number) => {
  const { title, description, type } = payLoad;

  //console.log(reporter_id)

  const result = await pool.query(
    `
     INSERT INTO issues(title, description, type, reporter_id) VALUES($1,$2,$3,$4) RETURNING *
    `,
    [title, description, type, reporter_id],
  );

  return result.rows[0];
};

//reusable helper function for getIssueFromDB and getIssueFromDBById
const attachReporterToIssues = async (issues: IIssues[]) => {
  if (issues.length === 0) return [];

  // 1. Get unique reporter IDs
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

  // 2. Fetch all reporters
  const usersResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = ANY($1)
    `,
    [reporterIds]
  );

  const users = usersResult.rows;

  // 3. Create lookup map
  const userMap = new Map(users.map((user) => [user.id, user]));

  // 4. Attach reporter object
  return issues.map((issue) => {
    const { reporter_id, ...rest } = issue;

    return {
      ...rest,
      reporter: userMap.get(reporter_id) || null,
    };
  });
};



const getIssueFromDB = async () => {
  const issuesResult = await pool.query(`
    SELECT *
    FROM issues
    ORDER BY created_at DESC
  `);

  const issues = issuesResult.rows;

  return await attachReporterToIssues(issues);
};



const getIssueFromDBById = async (id: string) => {
  const issueResult = await pool.query(
    `
    SELECT *
    FROM issues
    WHERE id = $1
    `,
    [id]
  );

  const issue = issueResult.rows[0];

  if (!issue) return null;

  const enrichedIssue = await attachReporterToIssues([issue]);

  return enrichedIssue[0];
};



const updateIssueInDB = async (payload: any, id: string) => {
  const { title, description, type, status } = payload;

  const result = await pool.query(
    `
    UPDATE issues
    SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      type = COALESCE($3, type),
      status = COALESCE($4, status)

    WHERE id = $5

    RETURNING *
    `,
    [title, description, type, status, id]
  );

   return result;
};

const deleteIssueFromDB = async (id: String) => {
  const result = await pool.query(
    `
    DELETE FROM issues WHERE id=$1  
      `,
    [id],
  );
  return result;
};

export const issuesService = {
  createIssuesIntoDB,
  getIssueFromDB,
  getIssueFromDBById,
  updateIssueInDB,
  deleteIssueFromDB,
};
