import { z } from "zod";

/**
 * Requirement 9.10: name required (2-120 chars); phone optional, validated
 * as a Philippine mobile or landline pattern; address and notes optional
 * with their own length caps. Lives in its own file (design §3.3) so the
 * client can import it for `zodResolver` and the server action can import
 * the same object for `safeParse`.
 */
const PH_PHONE = /^(09\d{9}|\+639\d{9}|0\d{1,2}\d{6,8})$/;

export const CustomerSchema = z.object({
  name: z.string().trim().min(2, { message: "Validation.nameTooShort" }).max(120),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((value) => value === "" || PH_PHONE.test(value), { message: "Validation.phoneInvalid" })
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CustomerFormValues = z.infer<typeof CustomerSchema>;
