"use server";

import { redirect } from "next/navigation";
import { ActionResult } from "@/types";
import { schemaSignIn } from "@/lib/schema-form";
import prisma from "../../../../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { lucia } from "@/lib/auth";
import { cookies } from "next/headers";

export async function SignIn(
  _: unknown,
  formData: FormData
): Promise<ActionResult> {
  //console.log(formData.get("email"));

  const validate = schemaSignIn.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validate.success) {
    //console.log(validate);
    return {
      error: validate.error.errors[0].message,
    };
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      email: validate.data.email,
      role: "superadmin"
    },
  });

  if (!existingUser) {
    return {
      error: "Email not found",
    };
  };

  const comparePassword = bcrypt.compareSync(
    validate.data.password,
    existingUser.password
  )

  if (!comparePassword) {
    return {
      error: "Incorrect password",
    };
  }

  const session = await lucia.createSession(
    existingUser.id,
    {
    //   id: existingUser.id,
    //   name: existingUser.name,
    //   email: existingUser.email,
    //   role: existingUser.role,
    }
  )

  const sessionCookie = lucia.createSessionCookie(session.id);
  (await cookies()).set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  )

  return redirect("/dashboard");
}
