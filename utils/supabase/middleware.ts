import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // Create a response object
  let supabaseResponse = NextResponse.next();

  // Initialize Supabase server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Fetch the authenticated user
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error fetching user:', error);
  }

  const currentPath = request.nextUrl.pathname;

  // Define allowed paths for unauthenticated users
  const allowedPaths = ['/', '/login', '/signup', '/reset_password', '/auth'];

  // Redirect logic for unauthenticated users
  if (!user && !allowedPaths.includes(currentPath)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Allow authenticated users to access the root page ('/') for role selection
  if (currentPath === '/') {
    return NextResponse.next(); // Allow access to '/'
  }

  // Role-based redirection for authenticated users accessing protected routes
  if (user) {
    const userType = user.user_metadata?.user_type; // Fetch user type from metadata

    // Protected route check for doctors
    if (currentPath.startsWith('/dashboard/doctor') && userType !== 'doctor') {
      const url = request.nextUrl.clone();
      url.pathname = '/login/doctor'; // Redirect unauthorized access
      return NextResponse.redirect(url);
    }

    // Protected route check for patients
    if (currentPath.startsWith('/dashboard/patient') && userType !== 'patient') {
      const url = request.nextUrl.clone();
      url.pathname = '/login/patient'; // Redirect unauthorized access
      return NextResponse.redirect(url);
    }
  }

  // Allow normal routing for authenticated users or allowed paths
  return supabaseResponse;
}
