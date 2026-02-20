import { BotConfig } from "@shared/schema";
import { useToggleBot } from "@/hooks/use-bot-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Activity, AlertTriangle, ShieldCheck, Power } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  config: BotConfig | null;
}

export function StatusCard({ config }: StatusCardProps) {
  const toggleBot = useToggleBot();
  const isActive = config?.isActive ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card border-none overflow-hidden relative">
        <div className={cn(
          "absolute top-0 left-0 w-1 h-full transition-colors duration-500",
          isActive ? "bg-green-500" : "bg-destructive"
        )} />
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Activity className={cn(
                "h-6 w-6 transition-colors duration-300",
                isActive ? "text-green-500" : "text-muted-foreground"
              )} />
              Bot Status
            </CardTitle>
            <CardDescription className="text-base">
              Control the main execution loop of your self-bot
            </CardDescription>
          </div>
          <div className="flex items-center space-x-4 bg-background/40 p-2 rounded-xl border border-white/5">
            <span className={cn(
              "text-sm font-medium transition-colors",
              isActive ? "text-green-400" : "text-muted-foreground"
            )}>
              {isActive ? "ACTIVE" : "STOPPED"}
            </span>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => toggleBot.mutate(checked)}
              disabled={toggleBot.isPending}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-background/40 rounded-lg p-4 border border-white/5 flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Token Status</p>
                <p className="text-lg font-bold">
                  {config?.token ? "Configured" : "Missing"}
                </p>
              </div>
            </div>

            <div className="bg-background/40 rounded-lg p-4 border border-white/5 flex items-center space-x-4 col-span-1 md:col-span-2">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                config?.lastError ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"
              )}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <p className={cn(
                  "text-sm font-mono mt-1",
                  config?.lastError ? "text-red-400" : "text-green-400"
                )}>
                  {config?.lastError || "All systems operational. No recent errors."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
