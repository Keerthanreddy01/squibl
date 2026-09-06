import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@squibl/database";

dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || "5000",
  nodeEnv: process.env.NODE_ENV || "development",

  // CORS
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
};

export const supabaseAdmin = createClient<Database>(
  config.supabase.url || "https://placeholder-project.supabase.co",
  config.supabase.serviceRoleKey || "placeholder-service-role-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
