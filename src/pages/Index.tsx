import { useAuth } from "@/hooks/useAuth";
import CivicMap from "@/components/map/IssueMap";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, Lightbulb, Droplets, Trash2, Shield, TreePine } from "lucide-react";

const Index = () => {
  const { user } = useAuth();

  const stats = [
    { icon: Construction, label: "Active Reports", value: "127", color: "text-orange-600" },
    { icon: Shield, label: "Resolved Issues", value: "892", color: "text-green-600" },
    { icon: Lightbulb, label: "Community Members", value: "2,341", color: "text-blue-600" },
    { icon: Droplets, label: "Response Rate", value: "88%", color: "text-green-600" },
  ];

  const civicCategories = [
    {
      name: "Roads",
      description: "Potholes, obstructions, damaged roads",
      icon: "🚧",
      color: "red",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
      descColor: "text-red-700"
    },
    {
      name: "Lighting",
      description: "Broken or flickering street lights",
      icon: "💡",
      color: "yellow",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-800",
      descColor: "text-yellow-700"
    },
    {
      name: "Water Supply",
      description: "Leaks, low pressure, pipe issues",
      icon: "💧",
      color: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      descColor: "text-blue-700"
    },
    {
      name: "Cleanliness",
      description: "Overflowing bins, garbage, sanitation",
      icon: "🗑️",
      color: "green",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      descColor: "text-green-700"
    },
    {
      name: "Public Safety",
      description: "Open manholes, exposed wiring, hazards",
      icon: "⚠️",
      color: "purple",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-800",
      descColor: "text-purple-700"
    },
    {
      name: "Obstructions",
      description: "Fallen trees, debris, blocked paths",
      icon: "🌳",
      color: "gray",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      textColor: "text-gray-800",
      descColor: "text-gray-700"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-green-500 to-orange-500 bg-clip-text text-transparent">
            CivicConnect
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Report infrastructure issues and help improve your community. From potholes to broken streetlights, make your voice heard.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold mt-2">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Map Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Infrastructure Issues Map</CardTitle>
                <CardDescription>
                  Real-time civic issues in your area. Click on markers for details and updates.
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Badge variant="destructive">Urgent</Badge>
                <Badge variant="outline" className="text-orange-600 border-orange-600">High</Badge>
                <Badge variant="outline" className="text-blue-600 border-blue-600">Medium</Badge>
                <Badge variant="outline" className="text-green-600 border-green-600">Low</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[600px]">
              <CivicMap />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity & Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Latest infrastructure issues reported by the community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { type: "Roads", location: "MG Road, Sector 14", time: "2 hours ago", priority: "high", icon: "🚧" },
                { type: "Lighting", location: "Park Avenue, Sector 22", time: "4 hours ago", priority: "medium", icon: "💡" },
                { type: "Water Supply", location: "Green Park Colony", time: "6 hours ago", priority: "urgent", icon: "💧" },
                { type: "Cleanliness", location: "Market Complex", time: "8 hours ago", priority: "low", icon: "🗑️" },
              ].map((report, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{report.icon}</span>
                    <div>
                      <div className="font-medium">{report.type}</div>
                      <div className="text-sm text-muted-foreground">{report.location}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={report.priority === "urgent" || report.priority === "high" ? "destructive" : "outline"}
                      className={
                        report.priority === "medium" ? "text-orange-600 border-orange-600" : 
                        report.priority === "low" ? "text-green-600 border-green-600" : ""
                      }
                    >
                      {report.priority}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">{report.time}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Issue Categories</CardTitle>
              <CardDescription>Common infrastructure problems you can report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {civicCategories.slice(0, 4).map((category, index) => (
                <div key={index} className={`p-4 rounded-lg ${category.bgColor} ${category.borderColor} border`}>
                  <h4 className={`font-medium ${category.textColor} mb-2 flex items-center space-x-2`}>
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </h4>
                  <p className={`text-sm ${category.descColor}`}>{category.description}</p>
                </div>
              ))}
              <div className="text-center pt-2">
                <Badge variant="outline" className="text-muted-foreground">
                  +2 more categories available
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 border-0">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Make a Difference in Your Community</h3>
            <p className="text-muted-foreground mb-4">
              Every report helps improve infrastructure and quality of life for everyone.
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">📍 Location-based reporting</Badge>
              <Badge variant="outline" className="px-3 py-1">📱 Mobile-friendly</Badge>
              <Badge variant="outline" className="px-3 py-1">🔒 Anonymous options</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;