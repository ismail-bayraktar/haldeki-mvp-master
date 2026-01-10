// ============================================================================
// Create Test Users Edge Function
// ============================================================================
// Purpose: Create comprehensive test accounts for ALL user roles
// Usage: supabase functions invoke create-test-users
// Security: Requires service_role key (admin only)
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

const TEST_USERS = [
  // 1. SUPERADMIN
  {
    email: "superadmin@test.haldeki.com",
    password: "Test1234!",
    email_confirm: true,
    user_metadata: {
      full_name: "Süper Yönetici",
      role: "superadmin",
      is_test_account: true,
    },
  },
  // 2. ADMIN
  {
    email: "admin@test.haldeki.com",
    password: "Test1234!",
    email_confirm: true,
    user_metadata: {
      full_name: "Sistem Yöneticisi",
      role: "admin",
      is_test_account: true,
    },
  },
  // 3. APPROVED DEALER
  {
    email: "dealer-approved@test.haldeki.com",
    password: "Test1234!",
    email_confirm: true,
    user_metadata: {
      full_name: "Mehmet Yılmaz",
      role: "dealer",
      is_test_account: true,
      company: "İzmir Yaş Sebze Ticaret",
    },
  },
  // 4. PENDING DEALER
  {
    email: "dealer-pending@test.haldeki.com",
    password: "Test1234!",
    email_confirm: true,
    user_metadata: {
      full_name: "Ayşe Demir",
      role: "dealer",
      is_test_account: true,
      company: "Ege Gıda Pazarlama",
    },
  },
  // 5. APPROVED SUPPLIER
  {
    email: "supplier-approved@test.haldeki.com",
    password: "Test1234!",
    email_confirm: true,
    user_metadata: {
      full_name: "Ali Kaya",
      role: "supplier",
      is_test_account: true,
      company: "Toroslu Çiftliği",
    },
  },
  // 6. PENDING SUPPLIER
  {
    email: "supplier-pending@test.haldeki.com",
    password: "Test1234!",
    email_confirm: true,
    user_metadata: {
      full_name: "Zeynep Arslan",
      role: "supplier",
      is_test_account: true,
      company: "Marmara Tarım Ürünleri",
    },
  },
  // 7. APPROVED BUSINESS
  {
    email: "business-approved@test.haldeki.com",
    password: "Test1234!",
    email_confirm: true,
    user_metadata: {
      full_name: "Can Öztürk",
      role: "business",
      is_test_account: true,
      company: "Lezzet Durağı Restoran",
    },
  },
  // 8. PENDING BUSINESS
  {
    email: "business-pending@test.haldeki.com",
    password: "Test1234!",
    email_confirm: true,
    user_metadata: {
      full_name: "Elif Şahin",
      role: "business",
      is_test_account: true,
      company: "Güneş Kafe & Pastane",
    },
  },
  // 9. CUSTOMER 1
  {
    email: "customer1@test.haldeki.com",
    password: "Test1234!",
    email_confirm: true,
    user_metadata: {
      full_name: "Fatma Yıldız",
      role: "user",
      is_test_account: true,
    },
  },
  // 10. CUSTOMER 2
  {
    email: "customer2@test.haldeki.com",
    password: "Test1234!",
    email_confirm: true,
    user_metadata: {
      full_name: "Hasan Çelik",
      role: "user",
      is_test_account: true,
    },
  },
];

serve(async (req) => {
  // Security: Only allow POST with service_role authorization
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...securityHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verify service role authorization
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!authHeader || !authHeader.includes("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      { status: 401, headers: { ...securityHeaders, "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.replace("Bearer ", "");
  if (token !== serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Service role required" }),
      { status: 403, headers: { ...securityHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const results = {
    created: [] as Array<{ email: string; id: string }>,
    skipped: [] as Array<{ email: string; reason: string }>,
    errors: [] as Array<{ email: string; error: string }>,
  };

  try {
    // Process each test user
    for (const user of TEST_USERS) {
      try {
        // Check if user already exists
        const checkResponse = await fetch(
          `${supabaseUrl}/rest/v1/profiles?email=eq.${user.email}`,
          {
            headers: {
              "apikey": serviceRoleKey!,
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
          }
        );

        if (checkResponse.ok) {
          const existing = await checkResponse.json();
          if (existing && existing.length > 0) {
            results.skipped.push({
              email: user.email,
              reason: "User already exists",
            });
            continue;
          }
        }

        // Create user using admin API
        const createResponse = await fetch(
          `${supabaseUrl}/auth/v1/admin/users`,
          {
            method: "POST",
            headers: {
              "apikey": serviceRoleKey!,
              "Authorization": `Bearer ${serviceRoleKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
          }
        );

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          results.errors.push({
            email: user.email,
            error: errorData.message || "Failed to create user",
          });
          continue;
        }

        const createdUser = await createResponse.json();
        results.created.push({
          email: user.email,
          id: createdUser.id,
        });

        // Wait a bit to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        results.errors.push({
          email: user.email,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: TEST_USERS.length,
          created: results.created.length,
          skipped: results.skipped.length,
          errors: results.errors.length,
        },
        results,
        message: "Auth users created successfully. Run the migration again to link them to profiles and roles.",
      }),
      { status: 200, headers: { ...securityHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...securityHeaders, "Content-Type": "application/json" } }
    );
  }
});
