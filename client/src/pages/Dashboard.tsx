import { useState } from "react";
import { useBotConfig, useUpdateBotConfig } from "@/hooks/use-bot-config";
import { useCommands, useDeleteCommand, useUpdateCommand } from "@/hooks/use-commands";
import { StatusCard } from "@/components/StatusCard";
import { CommandForm } from "@/components/CommandForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Trash2, 
  Clock, 
  Hash, 
  Terminal, 
  Loader2,
  Key
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { data: config, isLoading: isConfigLoading } = useBotConfig();
  const { data: commands, isLoading: isCommandsLoading } = useCommands();
  const updateConfig = useUpdateBotConfig();
  const updateCommand = useUpdateCommand();
  const deleteCommand = useDeleteCommand();

  const [token, setToken] = useState("");
  const [isCommandDialogOpen, setIsCommandDialogOpen] = useState(false);

  const handleTokenSave = () => {
    if (!token) return;
    updateConfig.mutate({ token });
    setToken("");
  };

  if (isConfigLoading || isCommandsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 lg:p-12 font-sans text-foreground">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Nexus<span className="text-primary">Bot</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Advanced Discord automation and self-bot management
            </p>
          </div>
        </header>

        {/* Status Section */}
        <StatusCard config={config ?? null} />

        {/* Token Configuration */}
        <Card className="glass-card border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Credentials
            </CardTitle>
            <CardDescription>
              Update your Discord authentication token securely
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="password"
                placeholder="Enter new Discord token..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="bg-background/50 border-white/10"
              />
              <Button 
                onClick={handleTokenSave}
                disabled={!token || updateConfig.isPending}
                className="bg-primary hover:bg-primary/90 text-white min-w-[100px]"
              >
                {updateConfig.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Commands Section */}
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Terminal className="h-6 w-6 text-primary" />
              Automation Rules
            </h2>
            
            <Dialog open={isCommandDialogOpen} onOpenChange={setIsCommandDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                  <Terminal className="mr-2 h-4 w-4" />
                  New Command
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-white/10 sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create Automation Rule</DialogTitle>
                  <DialogDescription>
                    Configure a new automated command to run on a schedule.
                  </DialogDescription>
                </DialogHeader>
                <CommandForm onSuccess={() => setIsCommandDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {commands?.map((cmd) => (
                <motion.div
                  key={cmd.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full bg-card/40 border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/20 hover:text-destructive"
                        onClick={() => deleteCommand.mutate(cmd.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 mb-2">
                          ID: {cmd.id}
                        </Badge>
                        <Switch
                          checked={cmd.isActive}
                          onCheckedChange={(checked) => 
                            updateCommand.mutate({ id: cmd.id, isActive: checked })
                          }
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                      <CardTitle className="text-xl font-mono text-white truncate pr-8">
                        {cmd.name}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground bg-black/20 p-2 rounded-md">
                        <Clock className="h-4 w-4 shrink-0 text-primary" />
                        <span className="font-medium">
                          {cmd.conditionType === 'interval' 
                            ? `Every ${cmd.conditionValue} mins` 
                            : `Cron: ${cmd.conditionValue}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-muted-foreground bg-black/20 p-2 rounded-md">
                        <Hash className="h-4 w-4 shrink-0 text-primary" />
                        <span className="font-mono text-xs truncate" title={cmd.channelId}>
                          {cmd.channelId}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {commands?.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed border-white/5 rounded-xl bg-card/20">
                <Terminal className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">No commands configured</p>
                <p className="text-sm">Create your first automation rule to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
