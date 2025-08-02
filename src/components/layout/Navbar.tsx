import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Plus, User, LogOut, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
        
      setUserRole(data?.role || null);
    };

    fetchUserRole();
  }, [user]);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <MapPin className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">CivicWatch</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <Button
                  variant={location.pathname === "/report" ? "default" : "ghost"}
                  asChild
                >
                  <Link to="/report" className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Report</span>
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="w-48">
                     <DropdownMenuItem asChild>
                       <Link to="/profile" className="flex items-center space-x-2 cursor-pointer">
                         <User className="h-4 w-4" />
                         <span>Profile</span>
                       </Link>
                     </DropdownMenuItem>
                     
                     {userRole === 'admin' && (
                       <DropdownMenuItem asChild>
                         <Link to="/admin" className="flex items-center space-x-2 cursor-pointer">
                           <Shield className="h-4 w-4" />
                           <span>Admin Panel</span>
                         </Link>
                       </DropdownMenuItem>
                     )}

                     <DropdownMenuSeparator />
                     
                     <DropdownMenuItem onClick={signOut} className="flex items-center space-x-2 cursor-pointer text-red-600">
                       <LogOut className="h-4 w-4" />
                       <span>Sign Out</span>
                     </DropdownMenuItem>
                   </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;