"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, History, Settings } from "lucide-react";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-primary text-primary-foreground p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          Malware Scanner
        </Link>
        <div className="space-x-4 flex items-center">
          <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" /> Home
            </Link>
          </Button>
          <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20">
            <Link to="/history">
              <History className="mr-2 h-4 w-4" /> Scan History
            </Link>
          </Button>
          <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20">
            <Link to="/clamav-info">
              <Settings className="mr-2 h-4 w-4" /> ClamAV Info
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;