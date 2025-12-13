import { User } from "@/types";
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import MY_TOKEN_KEY from "./get-cookie-name";

// UserResponse = type User & { token: string };
type UserResponse = User & { token: string };

export const isAuthenticated = async (): // req: NextRequest
Promise<UserResponse | NextResponse<unknown> | undefined> => {
  const authHeaders = await headers();
  const cookieStore = await cookies();
  const token = cookieStore.get(MY_TOKEN_KEY())?.value
    ? `Bearer ${cookieStore.get(MY_TOKEN_KEY())?.value}`
    : authHeaders.get("Authorization");

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        message: "Wrong castle fam :(",
      },
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const user = await fetch("https://huggingface.co/api/whoami-v2", {
    headers: {
      Authorization: token,
    },
    method: "GET",
  })
    .then((res) => res.json())
    .catch(() => {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid token",
        },
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    });
  if (!user || !user.id) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid token",
      },
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  return {
    ...user,
    token: token.replace("Bearer ", ""),
  };
};
