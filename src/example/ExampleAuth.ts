import { supabase } from "@/integrations/supabase/client";

async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Error signing in:", error.message);
    return null;
  }
  console.log("User signed in:", data.user);
  return data.user;
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error.message);
  } else {
    console.log("User signed out.");
  }
}