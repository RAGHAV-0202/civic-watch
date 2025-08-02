import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Create profile after successful signup (only if no profile exists)
        if (event === 'SIGNED_IN' && session?.user && session.user.user_metadata?.full_name) {
          setTimeout(async () => {
            try {
              // First check if profile already exists
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', session.user.id)
                .single();
              
              // Only create profile if it doesn't exist
              if (!existingProfile) {
                const userData = session.user.user_metadata;
                const { error } = await supabase
                  .from('profiles')
                  .insert({
                    user_id: session.user.id,
                    full_name: userData.full_name,
                    phone: userData.phone || '',
                    role: userData.role || 'citizen'
                  });
                
                if (error && error.code !== '23505') { // Ignore duplicate key errors
                  console.error('Error creating profile:', error);
                }
              }
            } catch (error) {
              console.error('Error in profile creation:', error);
            }
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null);
      setSession(null);
      
      // Then attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        // Even if Supabase signOut fails, we've cleared local state
        // Force a page reload to ensure clean state
        window.location.href = '/';
      }
    } catch (err) {
      console.error("Unexpected error during signout:", err);
      // Force reload on any error
      window.location.href = '/';
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};