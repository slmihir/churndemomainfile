import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PlaybookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlaybookModal({ isOpen, onClose }: PlaybookModalProps) {
  const [formData, setFormData] = useState({
    customerId: "",
    type: "Executive Check-in",
    priority: "medium",
    assignedCsm: "Sarah Chen",
    description: "",
    nextAction: "",
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const launchPlaybookMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/v1/playbooks/trigger", {
        customerId: parseInt(data.customerId),
        type: data.type,
        priority: data.priority,
        assignedCsm: data.assignedCsm,
        description: data.description,
        nextAction: data.nextAction,
        notes: data.notes,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
      toast({
        title: "Playbook Launched",
        description: `Intervention ${data.interventionId} has been successfully triggered.`,
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to launch playbook. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setFormData({
      customerId: "",
      type: "Executive Check-in",
      priority: "medium",
      assignedCsm: "Sarah Chen",
      description: "",
      nextAction: "",
      notes: "",
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      toast({
        title: "Error",
        description: "Please select a customer.",
        variant: "destructive",
      });
      return;
    }
    launchPlaybookMutation.mutate(formData);
  };

  const interventionTypes = [
    "Executive Check-in",
    "Product Training",
    "Special Offer",
    "Support Escalation",
    "Payment Recovery",
    "Engagement Boost",
  ];

  const csms = [
    "Sarah Chen",
    "Mike Johnson",
    "Lisa Wang",
    "David Kim",
    "Emma Thompson",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Launch CX Rescue Playbook</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="customer">Customer</Label>
            <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer..." />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name} - {customer.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="type">Intervention Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {interventionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="csm">Assigned CSM</Label>
            <Select value={formData.assignedCsm} onValueChange={(value) => setFormData({ ...formData, assignedCsm: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {csms.map((csm) => (
                  <SelectItem key={csm} value={csm}>
                    {csm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the intervention..."
            />
          </div>

          <div>
            <Label htmlFor="nextAction">Next Action</Label>
            <Input
              id="nextAction"
              value={formData.nextAction}
              onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
              placeholder="What's the next step?"
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any specific notes or context for this intervention..."
              className="h-24"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={launchPlaybookMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {launchPlaybookMutation.isPending ? "Launching..." : "Launch Playbook"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
