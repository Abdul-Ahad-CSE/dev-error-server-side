import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";
import type { ROLES } from "../types";

const auth = (...roles: ROLES[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    //console.log("this is protected route");
    //console.log(req.headers.authorization);
    //console.log(roles);
    try {
      const token = req.headers.authorization;

      // console.log(token);
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access!!",
        });
      }

      const decoded = jwt.verify(
        token as string,
        config.secret as string,
      ) as JwtPayload;

      //console.log(decoded);

      const userData = await pool.query(
        `
     SELECT * FROM users WHERE email=$1   
        `,
        [decoded.email], //next100@gmail.com
      );

      // console.log(userData);

      const user = userData.rows[0]; //

      // console.log(user);
      if (userData.rows.length === 0) {
        res.status(404).json({
          //1. why this condition?
          success: false, // ans is below;
          message: "User not found!",
        });
      }


      // roles = ["admin","agent"]
      // user.role = "admin" | "user" | "agent"

      if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden!!,This role have no access!",
        });
      }

      const reporter = {  
        id: decoded.id,
        name: decoded.name,
        role: decoded.role,
      };

      //This user is verified via email that it exist on our database .
      
      req.user = reporter; //req : { user : {} }
      //console.log("from auth.ts",req.user)
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;









/*

1. why this condition?

 suppose a token is generated for "x" user;
 now the user is deleted from db, but when the token is 
 decoded, is still has the user email,password etc.
 anyone can use the same token for 100ths time because of
 this.
 this is simply a bug that can cause error or encounter 
 security issue;

 also see first prompt: https://chatgpt.com/share/6a10b43e-7910-8322-8f95-c10c6d477bb3


2. second prompt: I didn't understand the concept of user here: req.user = decoded; // req : { user : {} }

3. third prompt: req.body have the data, then why req.user?

4. fourth prompt: I just came with a idea that, why i need accessToken ? Can't i just verify the email and password sent by postman directly from my database table via any code?



*/
