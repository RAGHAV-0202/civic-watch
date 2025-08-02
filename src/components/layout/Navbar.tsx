import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Plus, User, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <MapPin className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">CrimeWatch</span>
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
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="flex items-center space-x-2">
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