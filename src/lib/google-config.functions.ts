// src/lib/google-config.functions.ts
import { createServerFn } from "@tanstack/react-start";

export const getGoogleClientId = createServerFn({ method: "GET" }).handler(
  async () => {
    return {
      googleClientId: process.env.GOOGLE_CLIENT_ID || "788417855681-3g32890scg7on4tq0fksb5aocn9s6u10.apps.googleusercontent.com"
    };
  }
);
