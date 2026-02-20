import { z } from "zod";

export const loginSchema = z.object({
  userId: z
    .string()
    .min(1, "아이디를 입력하세요")
    .min(3, "아이디는 3자 이상이어야 합니다")
    .max(20, "아이디는 20자 이하여야 합니다")
    .regex(/^[a-zA-Z0-9_]+$/, "아이디는 영문, 숫자, 밑줄만 사용할 수 있습니다"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

export const registerSchema = z
  .object({
    userId: z
      .string()
      .min(1, "아이디를 입력하세요")
      .min(3, "아이디는 3자 이상이어야 합니다")
      .max(20, "아이디는 20자 이하여야 합니다")
      .regex(/^[a-zA-Z0-9_]+$/, "아이디는 영문, 숫자, 밑줄만 사용할 수 있습니다"),
    email: z
      .string()
      .min(1, "이메일을 입력하세요")
      .email("유효한 이메일 형식이 아닙니다"),
    password: z
      .string()
      .min(8, "비밀번호는 8자 이상이어야 합니다")
      .regex(
        /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
        "비밀번호는 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다"
      ),
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력하세요"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
