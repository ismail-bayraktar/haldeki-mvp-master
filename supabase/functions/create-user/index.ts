import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header - check multiple possible header names
    const authHeader = req.headers.get("Authorization") || 
                      req.headers.get("authorization") ||
                      req.headers.get("x-authorization");
    
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    console.log("Authorization header:", authHeader ? "Present" : "Missing");
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          error: "Authorization header missing",
          details: "Please ensure you are logged in and have a valid session"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role key
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

    // Verify the requesting user is admin
    const token = authHeader.replace("Bearer ", "").trim();
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Authorization token missing" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized",
          details: userError.message 
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user has admin or superadmin role
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "superadmin"]);

    if (rolesError) {
      console.error("Roles query error:", rolesError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to check user roles",
          details: rolesError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!roles || roles.length === 0) {
      console.error(`User ${user.id} (${user.email}) does not have admin role`);
      return new Response(
        JSON.stringify({ 
          error: "Admin access required",
          details: "User does not have admin or superadmin role"
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`User ${user.id} has roles:`, roles.map(r => r.role));

    // Parse request body
    const body = await req.json();
    const {
      email,
      password,
      role,
      dealerData,
      supplierData,
      sendEmail,
    } = body;

    // Validation
    if (!email || !password || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (role !== "dealer" && role !== "supplier") {
      return new Response(
        JSON.stringify({ error: "Invalid role" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user already exists (with pagination support)
    let existingUser = null;
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: usersPage, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: page,
        perPage: pageSize,
      });
      
      if (listError) {
        console.error("Error listing users:", listError);
        // Continue anyway - will fail on create if user exists
        break;
      }
      
      if (!usersPage?.users || usersPage.users.length === 0) {
        break; // No more users
      }
      
      existingUser = usersPage.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      
      if (existingUser) {
        break; // Found existing user
      }
      
      if (usersPage.users.length < pageSize) {
        break; // Last page
      }
      
      page++;
    }

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "User already exists" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create user with must_change_password flag
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: password,
        email_confirm: true,
        user_metadata: {
          must_change_password: true,
          full_name: dealerData?.contact_name || supplierData?.contact_name || "",
        },
      });

    if (createError) {
      console.error("Create user error:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: "User creation failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = newUser.user.id;

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: role });

    if (roleError) {
      console.error("Role assignment error:", roleError);
      // Continue even if role assignment fails - can be fixed manually
    }

    // Create dealer or supplier record
    if (role === "dealer" && dealerData) {
      const { error: dealerError } = await supabaseAdmin
        .from("dealers")
        .insert({
          user_id: userId,
          name: dealerData.name,
          contact_name: dealerData.contact_name || "",
          contact_phone: dealerData.contact_phone || "",
          contact_email: dealerData.contact_email || email,
          region_ids: dealerData.region_ids || [],
          tax_number: dealerData.tax_number || null,
          approval_status: "approved",
          is_active: true,
        });

      if (dealerError) {
        console.error("Dealer creation error:", dealerError);
        // Continue - user is created, dealer record can be fixed manually
      }
    } else if (role === "supplier" && supplierData) {
      const { error: supplierError } = await supabaseAdmin
        .from("suppliers")
        .insert({
          user_id: userId,
          name: supplierData.name,
          contact_name: supplierData.contact_name || "",
          contact_phone: supplierData.contact_phone || "",
          contact_email: supplierData.contact_email || email,
          product_categories: supplierData.product_categories || [],
          approval_status: "approved",
          is_active: true,
        });

      if (supplierError) {
        console.error("Supplier creation error:", supplierError);
        // Continue - user is created, supplier record can be fixed manually
      }
    }

    // Send email if requested (optional - can be implemented later)
    // For now, we'll just return success

    return new Response(
      JSON.stringify({
        success: true,
        userId: userId,
        email: email,
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

