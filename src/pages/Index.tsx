import { useAuth } from "@/hooks/useAuth";
import IssueMap from "@/components/map/IssueMap";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, CheckCircle, Users, TrendingUp } from "lucide-react";

const Index = () => {
  const { user } = useAuth();

  const stats = [
    { icon: Construction, label: "Open Issues", value: "87", color: "text-orange-600" },
    { icon: CheckCircle, label: "Resolved Issues", value: "234", color: "text-green-600" },
    { icon: Users, label: "Active Users", value: "1,205", color: "text-blue-600" },
    { icon: TrendingUp, label: "Resolution Rate", value: "73%", color: "text-green-600" },
  ];

  const recentReports = [
    { type: "Pothole", location: "Main St & 5th Ave", time: "2 hours ago", priority: "high" },
    { type: "Broken Streetlight", location: "Oak Park", time: "4 hours ago", priority: "medium" },
    { type: "Water Leak", location: "Downtown Plaza", time: "6 hours ago", priority: "urgent" },
  ];

  const priorityBadge = (priority: string) => {
    if (priority === "urgent") return "destructive";
    if (priority === "high") return "destructive";
    return "outline";
  };

  const priorityColor = (priority: string) => {
    if (priority === "medium") return "text-orange-600 border-orange-600";
    return "";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            CityWatch
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Report infrastructure issues and help improve your community. 
            From potholes to broken streetlights, make your voice heard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  <span className="text-sm font-medium text-gray-600">{stat.label}</span>
                </div>
                <div className="text-3xl font-bold mt-3 text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8 border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Infrastructure Map</CardTitle>
                <CardDescription>
                  Current issues reported in your area. Click markers for details.
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Badge variant="destructive">Urgent</Badge>
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Medium</Badge>
                <Badge variant="outline" className="text-green-600 border-green-600">Low</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] bg-gray-100 rounded-lg">
              <IssueMap />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Latest issues reported by residents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentReports.map((report, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">{report.type}</div>
                    <div className="text-sm text-gray-500">{report.location}</div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={priorityBadge(report.priority)}
                      className={priorityColor(report.priority)}
                    >
                      {report.priority}
                    </Badge>
                    <div className="text-sm text-gray-500 mt-1">{report.time}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Issue Categories</CardTitle>
              <CardDescription>Common infrastructure problems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">🚧 Roads & Traffic</h4>
                <p className="text-sm text-red-700">Potholes, damaged surfaces, traffic signals</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">💡 Lighting</h4>
                <p className="text-sm text-yellow-700">Broken streetlights, dark areas</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">💧 Water & Utilities</h4>
                <p className="text-sm text-blue-700">Leaks, pressure issues, outages</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;