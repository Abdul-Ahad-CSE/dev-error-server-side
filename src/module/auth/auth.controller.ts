import type { Request, Response } from "express";
import { authService } from "./auth.service";

const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);

    // const { refresh_token } = result;

    // res.cookie("refreshToken", refresh_token, {
    //   secure: false, // In production => True
    //   httpOnly: true,
    //   sameSite: "lax",
    // });


    res.status(200).json({
      success: true,
      message: "Login successful",
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

const registerUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.registerUserIntoDB(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
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

export const authController = {
  loginUser,
  registerUser,
};



