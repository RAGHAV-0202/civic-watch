import React from 'react';
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import AdminMap from "@/components/map/AdminMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Shield, 
  Flag, 
  BarChart3, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Eye,
  EyeOff,
  Trash2,
  Search,
  MapPin,
  Calendar,
  User,
  FileText
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
      // First fetch the reports with categories
      const { data: reportsData, error: reportsError } = await supabase
        .from('crime_reports')
        .select(`
          *,
          crime_categories (
            name,
            color
          )
        `)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Then fetch profiles separately and merge the data
      if (reportsData && reportsData.length > 0) {
        const userIds = [...new Set(reportsData.map(report => report.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        if (profilesError) {
          console.warn('Error fetching profiles:', profilesError);
          // Continue without profile data
        }

        // Merge the data
        const reportsWithProfiles = reportsData.map(report => ({
          ...report,
          profiles: profilesData?.find(profile => profile.user_id === report.user_id) || null
        }));

        setAllReports(reportsWithProfiles);
      } else {
        setAllReports([]);
      }
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
      case 'pending': return 'bg-warning/20 text-warning border-warning/30';
      case 'addressed': return 'bg-info/20 text-info border-info/30';
      case 'resolved': return 'bg-success/20 text-success border-success/30';
      case 'closed': return 'bg-muted/20 text-muted-foreground border-muted/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">Manage reports and monitor system activity</p>
            </div>
          </div>
          <Badge variant="secondary" className="px-4 py-2">
            <Users className="h-4 w-4 mr-2" />
            Administrator
          </Badge>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Reports</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{analytics.totalReports}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Active Reports</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{analytics.activeReports}</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Flagged Reports</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">{analytics.flaggedReports}</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <Flag className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Categories</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">{analytics.categoriesData.length}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map Section */}
        <div className="mb-8">
          <AdminMap />
        </div>

        <Tabs defaultValue="reports-table" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reports-table" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports Table
            </TabsTrigger>
            <TabsTrigger value="flagged" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Flagged Reports
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports-table" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Reports Management
                </CardTitle>
                <CardDescription>
                  View and manage all reports with table interface
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reports..."
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
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Title</TableHead>
                          <TableHead className="font-semibold">Category</TableHead>
                          <TableHead className="font-semibold">Reporter</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">Flags</TableHead>
                          <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReports.map((report) => (
                          <TableRow key={report.id} className={`${report.is_hidden ? 'opacity-60 bg-destructive/5' : ''} hover:bg-muted/30 transition-colors`}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium line-clamp-1">{report.title}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2">
                                  {report.description}
                                </div>
                                {report.is_hidden && (
                                  <Badge variant="secondary" className="text-xs">
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Hidden
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: report.crime_categories?.color }}
                                />
                                <span className="text-sm">{report.crime_categories?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{report.profiles?.full_name || 'Anonymous'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={report.status} 
                                onValueChange={(newStatus) => handleStatusChange(report.id, newStatus)}
                              >
                                <SelectTrigger className="w-[120px] h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="addressed">Addressed</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {new Date(report.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {report.is_flagged ? (
                                <Badge variant="destructive" className="text-xs">
                                  {report.flag_count} flags
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">None</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Report</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{report.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteReport(report.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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