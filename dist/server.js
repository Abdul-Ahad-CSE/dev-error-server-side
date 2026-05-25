

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  secret: process.env.JWT_SECRET
  //refresh_secret: process.env.JWT_REFRESH_SECRET,
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,

        name VARCHAR(40) NOT NULL,

        email VARCHAR(40) UNIQUE NOT NULL,

        password TEXT NOT NULL,

        role VARCHAR(11) DEFAULT 'contributor'
        CHECK (role IN ('contributor', 'maintainer')),

        created_at TIMESTAMP DEFAULT NOW(),

        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS update_users_updated_at ON users;

    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,

        title VARCHAR(150) NOT NULL,

        description TEXT NOT NULL
        CHECK (LENGTH(description) >= 20),

        type VARCHAR(20) NOT NULL
        CHECK (type IN ('bug', 'feature_request')),

        status VARCHAR(20) DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'resolved')),

        reporter_id INT NOT NULL,

        created_at TIMESTAMP DEFAULT NOW(),

        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE OR REPLACE FUNCTION update_issue_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS update_issues_updated_at ON issues;

    CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_issue_updated_at_column();
`);
    console.log("Database connected successfully!");
  } catch (error2) {
    console.log(error2);
  }
};

// src/module/user/issues.route.ts
import { Router } from "express";

// src/middleware/logger.ts
import fs from "fs";
var logger = (req, res, next) => {
  console.log("Method - URL - Time:", req.method, req.url, Date.now());
  const log = `
Method -> ${req.method} - Time -> ${Date.now()} - URL -> ${req.url}
`;
  fs.appendFile("logger.txt", log, (err) => {
  });
  next();
};
var logger_default = logger;

// src/module/user/issues.service.ts
import "bcryptjs";
var createIssuesIntoDB = async (payLoad, reporter_id) => {
  const { title, description, type } = payLoad;
  const result = await pool.query(
    `
     INSERT INTO issues(title, description, type, reporter_id) VALUES($1,$2,$3,$4) RETURNING *
    `,
    [title, description, type, reporter_id]
  );
  return result.rows[0];
};
var attachReporterToIssues = async (issues) => {
  if (issues.length === 0) return [];
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const usersResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = ANY($1)
    `,
    [reporterIds]
  );
  const users = usersResult.rows;
  const userMap = new Map(users.map((user) => [user.id, user]));
  return issues.map((issue) => {
    const { reporter_id, ...rest } = issue;
    return {
      ...rest,
      reporter: userMap.get(reporter_id) || null
    };
  });
};
var getIssueFromDB = async () => {
  const issuesResult = await pool.query(`
    SELECT *
    FROM issues
    ORDER BY created_at DESC
  `);
  const issues = issuesResult.rows;
  return await attachReporterToIssues(issues);
};
var getIssueFromDBById = async (id) => {
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
var updateIssueInDB = async (payload, id) => {
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
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM issues WHERE id=$1  
      `,
    [id]
  );
  return result;
};
var issuesService = {
  createIssuesIntoDB,
  getIssueFromDB,
  getIssueFromDBById,
  updateIssueInDB,
  deleteIssueFromDB
};

// src/module/user/issues.controller.ts
import "console";
var createIssues = async (req, res) => {
  const reporter = req.user;
  if (!reporter) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      errors: "No reporter found"
    });
  }
  try {
    const result = await issuesService.createIssuesIntoDB(
      req.body,
      reporter.id
    );
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error2) {
    res.status(500).json({
      success: false,
      message: error2.message,
      errors: error2
    });
  }
};
var getIssue = async (req, res) => {
  try {
    const result = await issuesService.getIssueFromDB();
    res.status(200).json({
      success: true,
      message: "Issues retrived successfully",
      data: result
    });
  } catch (error2) {
    res.status(500).json({
      success: false,
      message: error2.message,
      errors: error2
    });
  }
};
var getIssueById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue id",
        data: {}
      });
    }
    const result = await issuesService.getIssueFromDBById(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Issue not found!",
        data: {}
      });
    }
    return res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  } catch (error2) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: {}
    });
  }
};
var updateIssue = async (req, res) => {
  const { id } = req.params;
  const reporter = req.user;
  try {
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue id",
        errors: "The id you are searching is not in the list"
      });
    }
    const existingIssue = await issuesService.getIssueFromDBById(id);
    if (!existingIssue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found!",
        errors: "The issues you are searching is not in the list"
      });
    }
    if (!reporter) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: "sorry, reporter not found"
      });
    }
    const isMaintainer = reporter.role === "maintainer";
    const isOwner = Number(reporter.id) === Number(existingIssue.reporter.id);
    const isOpen = existingIssue.status === "open";
    if (!isMaintainer) {
      if (!isOwner || !isOpen) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Contributors can only update their own open issues"
        });
      }
    }
    const result = await issuesService.updateIssueInDB(req.body, id);
    return res.status(200).json({
      success: true,
      message: "Issue updated successfully!",
      data: result.rows[0]
    });
  } catch (error2) {
    return res.status(500).json({
      success: false,
      message: error2.message,
      errors: error2
    });
  }
};
var deleteIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issuesService.deleteIssueFromDB(id);
    console.log(result);
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "User Not found!"
      });
    }
    res.status(200).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error2) {
    res.status(500).json({
      success: false,
      message: error2.message,
      errors: error2
    });
  }
};
var issuesController = {
  createIssues,
  getIssue,
  getIssueById,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access!!"
        });
      }
      const decoded = jwt.verify(
        token,
        config_default.secret
      );
      const userData = await pool.query(
        `
     SELECT * FROM users WHERE email=$1   
        `,
        [decoded.email]
        //next100@gmail.com
      );
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        res.status(404).json({
          //1. why this condition?
          success: false,
          // ans is below;
          message: "User not found!"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden!!,This role have no access!"
        });
      }
      const reporter = {
        id: decoded.id,
        name: decoded.name,
        role: decoded.role
      };
      req.user = reporter;
      next();
    } catch (error2) {
      next(error2);
    }
  };
};
var auth_default = auth;

// src/types/index.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/module/user/issues.route.ts
var router = Router();
router.post(
  "/",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  issuesController.createIssues
);
router.get("/", issuesController.getIssue);
router.get("/:id", issuesController.getIssueById);
router.patch(
  "/:id",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  issuesController.updateIssue
);
router.delete(
  "/:id",
  auth_default(USER_ROLE.maintainer),
  issuesController.deleteIssue
);
var issuesRouter = router;

// src/module/auth/auth.route.ts
import { Router as Router2 } from "express";

// src/module/auth/auth.service.ts
import bcrypt2 from "bcryptjs";
import jwt2 from "jsonwebtoken";
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt2.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials!");
  }
  const jwtpayload = {
    id: user.id,
    name: user.name,
    is_active: user.is_active,
    role: user.role,
    email: user.email
  };
  const accessToken = jwt2.sign(jwtpayload, config_default.secret, {
    expiresIn: "1d"
  });
  const { password: _, ...safeUser } = user;
  return { token: accessToken, user: safeUser };
};
var registerUserIntoDB = async (payLoad) => {
  const { name, email, password, role } = payLoad;
  const hashPassword = await bcrypt2.hash(password, 10);
  const result = await pool.query(
    `
    INSERT INTO users(name, email, password, role)
    VALUES($1, $2, $3, COALESCE($4, 'contributor'))
    
    RETURNING 
      id,
      name,
      email,
      role,
      created_at,
      updated_at
    `,
    [name, email, hashPassword, role]
  );
  return result.rows[0];
};
var authService = {
  loginUserIntoDB,
  registerUserIntoDB
};

// src/module/auth/auth.controller.ts
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error2) {
    res.status(500).json({
      success: false,
      message: error2.message,
      errors: error2
    });
  }
};
var registerUser = async (req, res) => {
  try {
    const result = await authService.registerUserIntoDB(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error2) {
    res.status(500).json({
      success: false,
      message: error2.message,
      errors: error2
    });
  }
};
var authController = {
  loginUser,
  registerUser
};

// src/module/auth/auth.route.ts
var router2 = Router2();
router2.post("/login", authController.loginUser);
router2.post("/signup", authController.registerUser);
var authRoute = router2;

// src/app.ts
var app = express();
app.use(express.json());
app.use(logger_default);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Express Server",
    author: "DevPulse"
  });
});
app.use("/api/issues", issuesRouter);
app.use("/api/auth", authRoute);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map