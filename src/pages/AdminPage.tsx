import React from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Shield, 
  Flag, 
  BarChart3, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Search,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [flaggedReports, setFlaggedReports] = React.useState([]);
  const [allReports, setAllReports] = React.useState([]);
  const [analytics, setAnalytics] = React.useState({
    totalReports: 0,
    activeReports: 0,
    flaggedReports: 0,
    categoriesData: []
  });
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');

  // Check if user is admin
  React.useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } else {
        setUserRole(data?.role || null);
      }
      setLoading(false);
    };

    checkUserRole();
  }, [user]);

  // Fetch flagged reports and analytics
  React.useEffect(() => {
    if (userRole === 'officer') {
      fetchFlaggedReports();
      fetchAllReports();
      fetchAnalytics();
    }
  }, [userRole]);

  const fetchFlaggedReports = async () => {
    try {
      const { data, error } = await supabase
        .from('crime_reports')
        .select(`
          *,
          crime_categories (
            name,
            color
          ),
          flag_reports (
            id,
            reason,
            description,
            created_at,
            flagged_by
          )
        `)
        .eq('is_flagged', true)
        .order('flag_count', { ascending: false });

      if (error) throw error;
      setFlaggedReports(data || []);
    } catch (error) {
      console.error('Error fetching flagged reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch flagged reports",
        variant: "destructive"
      });
    }
  };

  const fetchAllReports = async () => {
    try {
      const { data, error } = await supabase
        .from('crime_reports')
        .select(`
          *,
          crime_categories (
            name,
            color
          ),
          profiles (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllReports(data || []);
    } catch (error) {
      console.error('Error fetching all reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive"
      });
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [reportsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('crime_reports')
          .select('status, created_at, is_flagged, category_id'),
        supabase
          .from('crime_categories')
          .select('*')
      ]);

      if (reportsResponse.error) throw reportsResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      const reports = reportsResponse.data || [];
      const categories = categoriesResponse.data || [];

      // Calculate category stats
      const categoriesData = categories.map(category => {
        const categoryReports = reports.filter(r => r.category_id === category.id);
        return {
          name: category.name,
          color: category.color,
          count: categoryReports.length,
          flagged: categoryReports.filter(r => r.is_flagged).length
        };
      }).sort((a, b) => b.count - a.count);

      setAnalytics({
        totalReports: reports.length,
        activeReports: reports.filter(r => r.status === 'pending').length,
        flaggedReports: reports.filter(r => r.is_flagged).length,
        categoriesData
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      });
    }
  };

  const handleApproveReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('crime_reports')
        .update({
          is_flagged: false,
          is_hidden: false,
          flag_count: 0,
          flagged_by: [],
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: 'Approved by admin - legitimate report'
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report approved and restored",
      });

      fetchFlaggedReports();
      fetchAnalytics();
    } catch (error) {
      console.error('Error approving report:', error);
      toast({
        title: "Error",
        description: "Failed to approve report",
        variant: "destructive"
      });
    }
  };

  const handleHideReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('crime_reports')
        .update({
          is_hidden: true,
          hidden_at: new Date().toISOString(),
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: 'Hidden by admin - spam/invalid content'
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report hidden successfully",
      });

      fetchFlaggedReports();
      fetchAnalytics();
    } catch (error) {
      console.error('Error hiding report:', error);
      toast({
        title: "Error",
        description: "Failed to hide report",
        variant: "destructive"
      });
    }
  };

  const handleUnhideReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('crime_reports')
        .update({
          is_hidden: false,
          hidden_at: null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: 'Unhidden by admin'
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Success", 
        description: "Report restored successfully",
      });

      fetchFlaggedReports();
      fetchAnalytics();
    } catch (error) {
      console.error('Error unhiding report:', error);
      toast({
        title: "Error",
        description: "Failed to restore report",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (reportId: string, newStatus: string, resolutionNotes?: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      };

      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolved_at = new Date().toISOString();
        if (resolutionNotes) {
          updateData.resolution_notes = resolutionNotes;
        }
      }

      const { error } = await supabase
        .from('crime_reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Report status updated to ${newStatus}`,
      });

      fetchAllReports();
      fetchAnalytics();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('crime_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report deleted successfully",
      });

      fetchAllReports();
      fetchFlaggedReports();
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive"
      });
    }
  };

  const filteredReports = allReports.filter(report => {
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.crime_categories?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'addressed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userRole !== 'officer') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Badge variant="secondary" className="ml-auto">
            Administrator
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-muted-foreground">Total Reports</span>
              </div>
              <div className="text-2xl font-bold mt-2">{analytics.totalReports}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-muted-foreground">Active Reports</span>
              </div>
              <div className="text-2xl font-bold mt-2">{analytics.activeReports}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Flag className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-muted-foreground">Flagged Reports</span>
              </div>
              <div className="text-2xl font-bold mt-2">{analytics.flaggedReports}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-muted-foreground">Categories</span>
              </div>
              <div className="text-2xl font-bold mt-2">{analytics.categoriesData.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all-reports" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all-reports">All Reports</TabsTrigger>
            <TabsTrigger value="flagged">Flagged Reports</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="all-reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  All Reports Management
                </CardTitle>
                <CardDescription>
                  View, manage, and update the status of all reports in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reports by title, description, or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="addressed">Addressed</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredReports.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No reports found matching your criteria.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {filteredReports.map((report) => (
                      <Card key={report.id} className={`border-l-4 ${report.is_hidden ? 'border-l-red-500 opacity-60' : 'border-l-blue-500'}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{report.title}</h3>
                                <Badge className={getStatusColor(report.status)}>
                                  {report.status}
                                </Badge>
                                {report.is_flagged && (
                                  <Badge variant="destructive">
                                    {report.flag_count} flags
                                  </Badge>
                                )}
                                {report.is_hidden && (
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <EyeOff className="h-3 w-3" />
                                    Hidden
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-muted-foreground mb-3">{report.description}</p>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                <span>Category: {report.crime_categories?.name}</span>
                                <span>•</span>
                                <span>Reporter: {report.profiles?.full_name || 'Anonymous'}</span>
                                <span>•</span>
                                <span>Created: {new Date(report.created_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>Priority: {report.priority}</span>
                              </div>

                              {report.resolution_notes && (
                                <div className="mb-4 p-3 bg-muted rounded-lg">
                                  <h4 className="font-medium mb-1">Resolution Notes:</h4>
                                  <p className="text-sm text-muted-foreground">{report.resolution_notes}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-2 ml-4">
                              <Select 
                                value={report.status} 
                                onValueChange={(newStatus) => {
                                  if (newStatus === 'resolved' || newStatus === 'closed') {
                                    // Could add a dialog for resolution notes here
                                    handleStatusChange(report.id, newStatus);
                                  } else {
                                    handleStatusChange(report.id, newStatus);
                                  }
                                }}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="addressed">Addressed</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="flex items-center gap-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the report
                                      "{report.title}" and remove it from the system.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteReport(report.id)}>
                                      Delete Report
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flagged" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Flagged Reports Management
                </CardTitle>
                <CardDescription>
                  Review and manage reports flagged by users as spam or inappropriate
                </CardDescription>
              </CardHeader>
              <CardContent>
                {flaggedReports.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      No flagged reports to review. All reports are clean!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {flaggedReports.map((report) => (
                      <Card key={report.id} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{report.title}</h3>
                                <Badge variant="destructive">
                                  {report.flag_count} flags
                                </Badge>
                                {report.is_hidden && (
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <EyeOff className="h-3 w-3" />
                                    Hidden
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-muted-foreground mb-3">{report.description}</p>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                <span>Category: {report.crime_categories?.name}</span>
                                <span>•</span>
                                <span>Reported: {new Date(report.created_at).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>Priority: {report.priority}</span>
                              </div>

                              {report.flag_reports && report.flag_reports.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="font-medium mb-2">Flag Reasons:</h4>
                                  <div className="space-y-1">
                                    {report.flag_reports.map((flag, index) => (
                                      <div key={index} className="text-sm">
                                        <Badge variant="outline" className="mr-2">
                                          {flag.reason}
                                        </Badge>
                                        {flag.description && (
                                          <span className="text-muted-foreground">
                                            {flag.description}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-2 ml-4">
                              {!report.is_hidden ? (
                                <>
                                  <Button
                                    onClick={() => handleApproveReport(report.id)}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={() => handleHideReport(report.id)}
                                    variant="destructive"
                                    size="sm"
                                    className="flex items-center gap-1"
                                  >
                                    <EyeOff className="h-4 w-4" />
                                    Hide
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  onClick={() => handleUnhideReport(report.id)}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1"
                                >
                                  <Eye className="h-4 w-4" />
                                  Unhide
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Most Reported Categories</CardTitle>
                  <CardDescription>
                    Categories with the highest number of reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.categoriesData.map((category, index) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-muted-foreground">
                              #{index + 1}
                            </span>
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: category.color }}
                            />
                          </div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">
                            {category.count} reports
                          </Badge>
                          {category.flagged > 0 && (
                            <Badge variant="destructive">
                              {category.flagged} flagged
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>
                    Overall platform statistics and health metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Flag Rate</span>
                      <span className="font-medium">
                        {analytics.totalReports > 0 
                          ? ((analytics.flaggedReports / analytics.totalReports) * 100).toFixed(1)
                          : 0
                        }%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Active Reports</span>
                      <span className="font-medium">{analytics.activeReports}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Pending Review</span>
                      <span className="font-medium text-orange-600">
                        {flaggedReports.filter(r => !r.reviewed_by).length}
                      </span>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="h-4 w-4" />
                        <span>
                          {analytics.flaggedReports > 5 
                            ? "High flagging activity detected" 
                            : "Normal flagging activity"
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;