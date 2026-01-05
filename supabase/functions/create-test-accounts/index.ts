import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Test accounts configuration
const TEST_ACCOUNTS = [
  // Superadmin
  {
    email: "superadmin@test.haldeki.com",
    password: "Test1234!",
    full_name: "Süper Yönetici",
    phone: "0532 100 00 01",
    role: "superadmin",
  },
  // Admin
  {
    email: "admin@test.haldeki.com",
    password: "Test1234!",
    full_name: "Sistem Yöneticisi",
    phone: "0532 100 00 02",
    role: "admin",
  },
  // Approved Dealer
  {
    email: "dealer-approved@test.haldeki.com",
    password: "Test1234!",
    full_name: "Mehmet Yılmaz",
    phone: "0532 200 00 01",
    role: "dealer",
    dealer_data: {
      name: "İzmir Yaş Sebze Ticaret",
      contact_name: "Mehmet Yılmaz",
      contact_phone: "0532 200 00 01",
      contact_email: "dealer-approved@test.haldeki.com",
      tax_number: "1234567890",
      approval_status: "approved",
      is_active: true,
    },
  },
  // Pending Dealer
  {
    email: "dealer-pending@test.haldeki.com",
    password: "Test1234!",
    full_name: "Ayşe Demir",
    phone: "0532 200 00 02",
    role: "dealer",
    dealer_data: {
      name: "Ege Gıda Pazarlama",
      contact_name: "Ayşe Demir",
      contact_phone: "0532 200 00 02",
      contact_email: "dealer-pending@test.haldeki.com",
      tax_number: "0987654321",
      approval_status: "pending",
      is_active: false,
    },
  },
  // Approved Supplier
  {
    email: "supplier-approved@test.haldeki.com",
    password: "Test1234!",
    full_name: "Ali Kaya",
    phone: "0533 300 00 01",
    role: "supplier",
    supplier_data: {
      name: "Toroslu Çiftliği",
      contact_name: "Ali Kaya",
      contact_phone: "0533 300 00 01",
      contact_email: "supplier-approved@test.haldeki.com",
      product_categories: ["sebze", "meyve", "yeşillik"],
      approval_status: "approved",
      is_active: true,
    },
  },
  // Pending Supplier
  {
    email: "supplier-pending@test.haldeki.com",
    password: "Test1234!",
    full_name: "Zeynep Arslan",
    phone: "0533 300 00 02",
    role: "supplier",
    supplier_data: {
      name: "Marmara Tarım Ürünleri",
      contact_name: "Zeynep Arslan",
      contact_phone: "0533 300 00 02",
      contact_email: "supplier-pending@test.haldeki.com",
      product_categories: ["meyve"],
      approval_status: "pending",
      is_active: false,
    },
  },
  // Approved Business
  {
    email: "business-approved@test.haldeki.com",
    password: "Test1234!",
    full_name: "Can Öztürk",
    phone: "0534 400 00 01",
    role: "business",
    business_data: {
      company_name: "Lezzet Durağı Restoran",
      contact_name: "Can Öztürk",
      contact_phone: "0534 400 00 01",
      contact_email: "business-approved@test.haldeki.com",
      business_type: "restaurant",
      tax_number: "1122334455",
      tax_office: "Menemen",
      approval_status: "approved",
      is_active: true,
    },
  },
  // Pending Business
  {
    email: "business-pending@test.haldeki.com",
    password: "Test1234!",
    full_name: "Elif Şahin",
    phone: "0534 400 00 02",
    role: "business",
    business_data: {
      company_name: "Güneş Kafe & Pastane",
      contact_name: "Elif Şahin",
      contact_phone: "0534 400 00 02",
      contact_email: "business-pending@test.haldeki.com",
      business_type: "cafe",
      tax_number: "9988776655",
      tax_office: "Bornova",
      approval_status: "pending",
      is_active: false,
    },
  },
  // Customer 1
  {
    email: "customer1@test.haldeki.com",
    password: "Test1234!",
    full_name: "Fatma Yıldız",
    phone: "0535 500 00 01",
    role: "user",
  },
  // Customer 2
  {
    email: "customer2@test.haldeki.com",
    password: "Test1234!",
    full_name: "Hasan Çelik",
    phone: "0535 500 00 02",
    role: "user",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const results = {
      created: [] as string[],
      skipped: [] as string[],
      errors: [] as string[],
    };

    // Get Menemen region ID for region assignments
    const { data: regions } = await supabaseAdmin
      .from("regions")
      .select("id")
      .eq("slug", "menemen")
      .limit(1);

    const menemenId = regions?.[0]?.id;

    for (const account of TEST_ACCOUNTS) {
      try {
        // Check if user exists (with pagination)
        let existingUser = null;
        let page = 0;
        const pageSize = 1000;

        while (true) {
          const { data: usersPage } = await supabaseAdmin.auth.admin.listUsers({
            page: page,
            perPage: pageSize,
          });

          if (!usersPage?.users || usersPage.users.length === 0) break;

          existingUser = usersPage.users.find(
            (u) => u.email?.toLowerCase() === account.email.toLowerCase()
          );

          if (existingUser) break;
          if (usersPage.users.length < pageSize) break;

          page++;
        }

        if (existingUser) {
          results.skipped.push(account.email);
          console.log(`User ${account.email} already exists, skipping`);
          continue;
        }

        // Create auth user
        const { data: newUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: account.email.toLowerCase().trim(),
            password: account.password,
            email_confirm: true,
            user_metadata: {
              full_name: account.full_name,
            },
          });

        if (createError || !newUser.user) {
          results.errors.push(`${account.email}: ${createError?.message || "Unknown error"}`);
          console.error(`Error creating ${account.email}:`, createError);
          continue;
        }

        const userId = newUser.user.id;

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: userId,
            email: account.email,
            full_name: account.full_name,
            phone: account.phone,
          });

        if (profileError) {
          console.error(`Profile creation error for ${account.email}:`, profileError);
        }

        // Assign role
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: account.role });

        if (roleError) {
          console.error(`Role assignment error for ${account.email}:`, roleError);
        }

        // Create role-specific records
        if (account.role === "dealer" && account.dealer_data) {
          const { error: dealerError } = await supabaseAdmin
            .from("dealers")
            .insert({
              id: userId,
              user_id: userId,
              name: account.dealer_data.name,
              contact_name: account.dealer_data.contact_name,
              contact_phone: account.dealer_data.contact_phone,
              contact_email: account.dealer_data.contact_email,
              region_ids: menemenId && account.dealer_data.approval_status === "approved"
                ? [menemenId]
                : [],
              tax_number: account.dealer_data.tax_number,
              approval_status: account.dealer_data.approval_status,
              is_active: account.dealer_data.is_active,
            });

          if (dealerError) {
            console.error(`Dealer creation error for ${account.email}:`, dealerError);
          }
        } else if (account.role === "supplier" && account.supplier_data) {
          const { error: supplierError } = await supabaseAdmin
            .from("suppliers")
            .insert({
              id: userId,
              user_id: userId,
              name: account.supplier_data.name,
              contact_name: account.supplier_data.contact_name,
              contact_phone: account.supplier_data.contact_phone,
              contact_email: account.supplier_data.contact_email,
              product_categories: account.supplier_data.product_categories,
              approval_status: account.supplier_data.approval_status,
              is_active: account.supplier_data.is_active,
            });

          if (supplierError) {
            console.error(`Supplier creation error for ${account.email}:`, supplierError);
          }
        } else if (account.role === "business" && account.business_data) {
          const { error: businessError } = await supabaseAdmin
            .from("businesses")
            .insert({
              id: userId,
              user_id: userId,
              company_name: account.business_data.company_name,
              contact_name: account.business_data.contact_name,
              contact_phone: account.business_data.contact_phone,
              contact_email: account.business_data.contact_email,
              business_type: account.business_data.business_type,
              tax_number: account.business_data.tax_number,
              tax_office: account.business_data.tax_office,
              region_ids: menemenId && account.business_data.approval_status === "approved"
                ? [menemenId]
                : [],
              approval_status: account.business_data.approval_status,
              is_active: account.business_data.is_active,
            });

          if (businessError) {
            console.error(`Business creation error for ${account.email}:`, businessError);
          }
        }

        results.created.push(account.email);
        console.log(`Successfully created ${account.email}`);
      } catch (accountError) {
        results.errors.push(`${account.email}: ${accountError instanceof Error ? accountError.message : "Unknown error"}`);
        console.error(`Error processing ${account.email}:`, accountError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          total: TEST_ACCOUNTS.length,
          created: results.created.length,
          skipped: results.skipped.length,
          errors: results.errors.length,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
