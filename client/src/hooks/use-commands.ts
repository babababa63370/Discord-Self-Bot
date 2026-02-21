import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateCommandRequest, type UpdateCommandRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCommands() {
  return useQuery({
    queryKey: [api.commands.list.path],
    queryFn: async () => {
      const res = await fetch(api.commands.list.path);
      if (!res.ok) throw new Error("Failed to fetch commands");
      return api.commands.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCommand() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateCommandRequest) => {
      const res = await fetch(api.commands.create.path, {
        method: api.commands.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create command");
      }
      return api.commands.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.commands.list.path] });
      toast({
        title: "Command Created",
        description: "New automation rule has been added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCommand() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateCommandRequest) => {
      const url = buildUrl(api.commands.update.path, { id });
      const res = await fetch(url, {
        method: api.commands.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to update command");
      return api.commands.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.commands.list.path] });
      toast({ title: "Command Updated" });
    },
  });
}

export function useTestCommand() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.commands.test.path, { id });
      const res = await fetch(url, {
        method: api.commands.test.method,
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to test command");
      }
      return api.commands.test.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Test Successful",
          description: data.message,
        });
      } else {
        toast({
          title: "Test Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Test Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCommand() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.commands.delete.path, { id });
      const res = await fetch(url, { method: api.commands.delete.method });
      if (!res.ok) throw new Error("Failed to delete command");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.commands.list.path] });
      toast({
        title: "Command Deleted",
        description: "The automation rule has been removed.",
        variant: "destructive",
      });
    },
  });
}
