import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type BotConfigResponse, type UpdateConfigRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useBotConfig() {
  return useQuery({
    queryKey: [api.config.get.path],
    queryFn: async () => {
      const res = await fetch(api.config.get.path);
      if (!res.ok) throw new Error("Failed to fetch config");
      const data = await res.json();
      return api.config.get.responses[200].parse(data);
    },
  });
}

export function useUpdateBotConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateConfigRequest) => {
      const res = await fetch(api.config.update.path, {
        method: api.config.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update config");
      }
      
      return api.config.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.config.get.path] });
      toast({
        title: "Configuration Saved",
        description: "Bot settings have been updated successfully.",
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

export function useToggleBot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await fetch(api.config.toggle.path, {
        method: api.config.toggle.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (!res.ok) throw new Error("Failed to toggle bot");
      return api.config.toggle.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.config.get.path] });
      toast({
        title: data.isActive ? "Bot Started" : "Bot Stopped",
        description: data.isActive 
          ? "The bot is now running and processing commands." 
          : "The bot has been completely stopped.",
        variant: data.isActive ? "default" : "destructive",
      });
    },
  });
}
