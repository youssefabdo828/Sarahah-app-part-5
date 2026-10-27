import { z } from "zod";
import { genderEnum } from "../../common/enum/constants.js";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user id");


export const getUserProfile = z.object();


export const getAllUsers = z.object({
  query: z.strictObject({}),
});


export const updateUser = z.object({
  body: z
    .strictObject({
      firstName: z.string({ error: "provide valid firstName" }).trim().min(5).max(50).optional(),
      lastName: z.string({ error: "provide valid lastName" }).trim().min(3).max(50).optional(),
      email: z.email({ error: "please provide valid email" }).toLowerCase().optional(),
      gender: z.enum(genderEnum).optional(),
      age: z
        .number({ error: "age must be a number" })
        .int({ error: "age must be an integer" })
        .min(16, { error: "age must be at least 16" })
        .max(60, { error: "age must not be more than 60" })
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Send at least one field to update",
    }),
});


export const deleteUser = z.object();