import { Response } from "express";

export const successResponse = (res: Response, message: string, data: unknown = {}, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, status: statusCode, message, data });
};

export const errorResponse = (res: Response, message: string, statusCode = 500) => {
  return res.status(statusCode).json({ success: false, status: statusCode, message, data: null });
};

export const setCookie = (res: Response, name: string, value: string, time: number) => {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    domain: ".trackyflow.sbs",
    maxAge: time
  });
};