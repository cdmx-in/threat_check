"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, History, Settings, LogOut, LogIn } from "lucide-react";
import { useSession } from "@/integrations/supabase/auth"; // Import useSession hook
import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import { toast } from "sonner";

const Navbar: React.FC = () => {
  const { session, loading } = useSession();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out.");
    } else {
      toast.success("Successfully logged out.");
    }
  };

  return (
    <nav className="bg-primary text-primary-foreground p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          Malware Scanner
        </Link>
        <div className="space-x-4 flex items-center">
          <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary/80">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" /> Home
            </Link>
          </Button>
          {!loading && session && ( // Show these links only if logged in
            <>
              <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                <Link to="/history">
                  <History className="mr-2 h-4 w-4" /> Scan History
                </Link>
              </Button>
              <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                <Link to="/admin">
                  <Settings className="mr-2 h-4 w-4" /> Admin
                </Link>
              </Button>
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </>
          )}
          {!loading && !session && ( // Show login button if not logged in
            <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary/80">
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;