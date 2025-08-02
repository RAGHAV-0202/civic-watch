import { useState, useEffect } from "react";
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
import { MapPin, Construction } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { IssueCategory } from "@/integrations/supabase/types";

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

function ReportPage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
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

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('issue_categories')
      .select('*')
      .order('name');
    
    if (error) {
      toast.error("Failed to load categories");
    } else {
      setCategories(data || []);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setValue("latitude", latitude);
        setValue("longitude", longitude);
        toast.success("Location captured!");
      },
      () => {
        toast.error("Unable to get your location");
      }
    );
  };

  const onSubmit = async (data: ReportFormData) => {
    if (!user) {
      toast.error("Please log in to report issues");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('issue_reports')
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
        toast.error("Failed to submit report");
        console.error("Submit error:", error);
      } else {
        toast.success("Issue reported successfully!");
        reset();
        setLocation(null);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("Unexpected error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Construction className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Report an Issue</h1>
          <p className="text-gray-600">
            Help improve your community by reporting infrastructure problems
          </p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the problem"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => setValue("categoryId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                        {category.description && ` - ${category.description}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-red-600">{errors.categoryId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(value) => setValue("priority", value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Minor issue</SelectItem>
                    <SelectItem value="medium">Medium - Needs attention</SelectItem>
                    <SelectItem value="high">High - Important fix needed</SelectItem>
                    <SelectItem value="urgent">Urgent - Safety hazard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

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
                    <span>Get Current Location</span>
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
                      <p className="text-sm text-red-600">{errors.latitude.message}</p>
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
                      <p className="text-sm text-red-600">{errors.longitude.message}</p>
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setValue("isAnonymous", checked)}
                />
                <Label htmlFor="anonymous">Submit anonymously</Label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ReportPage;