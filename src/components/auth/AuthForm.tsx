import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().optional(),
  role: z.enum(["citizen", "officer"]),
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

interface AuthFormProps {
  mode: "signin" | "signup";
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const AuthForm = ({ mode, isLoading, setIsLoading }: AuthFormProps) => {
  const isSignUp = mode === "signup";
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: isSignUp ? {
      role: "citizen",
    } : {},
  });

  const role = watch("role");

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        const signUpData = data as SignUpFormData;
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email: signUpData.email,
          password: signUpData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: signUpData.fullName,
              phone: signUpData.phone,
              role: signUpData.role,
            },
          },
        });
        
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Check your email for the confirmation link!");
        }
      } else {
        const signInData = data as SignInFormData;
        
        const { error } = await supabase.auth.signInWithPassword({
          email: signInData.email,
          password: signInData.password,
        });
        
        if (error) {
          if (error.message.includes("Invalid")) {
            toast.error("Invalid email or password. Please try again.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Welcome back!");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{String(errors.email.message)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{String(errors.password.message)}</p>
        )}
      </div>

      {isSignUp && (
        <>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{String(errors.fullName.message)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              placeholder="+1 (555) 123-4567"
              {...register("phone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Account Type</Label>
            <Select value={role} onValueChange={(value) => setValue("role", value as "citizen" | "officer")}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="citizen">Citizen</SelectItem>
                <SelectItem value="officer">Law Enforcement Officer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
      </Button>
    </form>
  );
};