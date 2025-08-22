import { useToast } from "@/hooks/use-toast";

export function useToastError() {
  const { toast } = useToast();
  return (title = "Something went wrong", description?: string) =>
    toast({
      title,
      description,
      variant: "destructive",
    });
}


