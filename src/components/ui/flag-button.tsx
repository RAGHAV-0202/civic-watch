import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FlagButtonProps {
  reportId: string;
  reportTitle: string;
}

const FlagButton: React.FC<FlagButtonProps> = ({ reportId, reportTitle }) => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const flagReasons = [
    'spam',
    'inappropriate_content',
    'false_information',
    'duplicate',
    'off_topic',
    'harassment',
    'other'
  ];

  const handleSubmitFlag = async () => {
    if (!reason) {
      toast({
        title: "Error",
        description: "Please select a reason for flagging",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('flag_issue', {
        issue_id: reportId,
        flag_reason: reason,
        flag_description: description || null
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Report Flagged",
          description: "Thank you for helping keep our community safe. The report has been flagged for review.",
        });
        setOpen(false);
        setReason('');
        setDescription('');
      } else {
        toast({
          title: "Already Flagged",
          description: "You have already flagged this report.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error flagging report:', error);
      toast({
        title: "Error",
        description: "Failed to flag report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
          <Flag className="h-4 w-4 mr-1" />
          Flag
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Flag Report
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              You are flagging: <span className="font-medium">"{reportTitle}"</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Please help us understand why this report should be reviewed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for flagging *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                <SelectItem value="false_information">False Information</SelectItem>
                <SelectItem value="duplicate">Duplicate Report</SelectItem>
                <SelectItem value="off_topic">Off Topic</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide more context about why you're flagging this report..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitFlag} 
              disabled={submitting || !reason}
              variant="destructive"
            >
              {submitting ? "Flagging..." : "Submit Flag"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlagButton;