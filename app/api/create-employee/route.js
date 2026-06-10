import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// This route uses the SERVICE ROLE key (server-side only, never exposed to browser)
// It creates the Auth user + profile in one atomic operation.
export async function POST(req) {
  const { full_name, email, password, role, department, status } = await req.json();

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: "Full name, email, and password are required." }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY  // set this in Vercel env vars
  );

  // Step 1: Create the Auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,  // auto-confirm, no verification email needed
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const userId = authData.user.id;

  // Step 2: Create the profile record (now the FK constraint is satisfied)
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({
      id:         userId,
      email,
      full_name,
      role:       role || "EMPLOYEE",
      department: department || "",
      status:     status || "ACTIVE",
    });

  if (profileError) {
    // Rollback: delete the auth user we just created
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, userId });
}
