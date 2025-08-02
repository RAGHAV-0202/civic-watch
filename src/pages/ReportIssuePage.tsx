import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/layout/Navbar";
import { MapPin, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const reportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categoryId: z.string().min(1, "Please select a category"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  isAnonymous: z.boolean(),
});

type ReportFormData = z.infer<typeof reportSchema>;

const ReportPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{id: string, name: string, description: string}>>([]);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      priority: "medium",
      isAnonymous: false,
    },
  });

  const isAnonymous = watch("isAnonymous");
  const priority = watch("priority");

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          setValue("latitude", latitude);
          setValue("longitude", longitude);
          toast.success("Location captured successfully!");
        },
        (error) => {
          toast.error("Unable to get your location. Please enter manually.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  // Load categories on component mount
  useState(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('crime_categories')
        .select('id, name, description')
        .order('name');
      
      if (error) {
        toast.error("Failed to load categories");
      } else {
        setCategories(data || []);
      }
    };
    
    loadCategories();
  });

  const onSubmit = async (data: ReportFormData) => {
    if (!user) {
      toast.error("You must be logged in to report crimes");
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('crime_reports')
        .insert({
          user_id: user.id,
          category_id: data.categoryId,
          title: data.title,
          description: data.description,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          priority: data.priority,
          is_anonymous: data.isAnonymous,
        });

      if (error) {
        toast.error("Failed to submit report. Please try again.");
        console.error("Error submitting report:", error);
      } else {
        toast.success("Report submitted successfully! Authorities have been notified.");
        // Reset form or redirect
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <AlertTriangle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Report an Incident</h1>
          <p className="text-muted-foreground">
            Help keep your community safe by reporting incidents in your area
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Incident Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Incident Title</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the incident"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => setValue("categoryId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select incident category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name} - {category.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select value={priority} onValueChange={(value) => setValue("priority", value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Non-urgent</SelectItem>
                    <SelectItem value="medium">Medium - Standard response</SelectItem>
                    <SelectItem value="high">High - Urgent attention needed</SelectItem>
                    <SelectItem value="urgent">Urgent - Immediate response required</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide as much detail as possible about what happened..."
                  rows={4}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Location</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    className="flex items-center space-x-2"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Use Current Location</span>
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="40.7128"
                      {...register("latitude", { valueAsNumber: true })}
                    />
                    {errors.latitude && (
                      <p className="text-sm text-destructive">{errors.latitude.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="-74.0060"
                      {...register("longitude", { valueAsNumber: true })}
                    />
                    {errors.longitude && (
                      <p className="text-sm text-destructive">{errors.longitude.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Input
                    id="address"
                    placeholder="Street address or landmark"
                    {...register("address")}
                  />
                </div>
              </div>

              {/* Anonymous reporting */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setValue("isAnonymous", checked)}
                />
                <Label htmlFor="anonymous">Submit anonymously</Label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Submitting Report..." : "Submit Report"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportPage;