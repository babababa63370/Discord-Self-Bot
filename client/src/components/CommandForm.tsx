import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCommandSchema, type InsertCommand } from "@shared/schema";
import { useCreateCommand } from "@/hooks/use-commands";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Terminal } from "lucide-react";

interface CommandFormProps {
  onSuccess?: () => void;
}

export function CommandForm({ onSuccess }: CommandFormProps) {
  const createCommand = useCreateCommand();
  
  const form = useForm<InsertCommand>({
    resolver: zodResolver(insertCommandSchema),
    defaultValues: {
      name: "",
      conditionType: "interval",
      conditionValue: "120",
      channelId: "",
      isActive: true,
    },
  });

  function onSubmit(data: InsertCommand) {
    createCommand.mutate(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Command Text</FormLabel>
              <FormControl>
                <div className="relative">
                  <Terminal className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="/bump" className="pl-9 bg-background/50 border-white/10" {...field} />
                </div>
              </FormControl>
              <FormDescription>The exact text command to send to Discord.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="conditionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trigger Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background/50 border-white/10">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="interval">Interval (Minutes)</SelectItem>
                    <SelectItem value="cron">Cron Expression</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="conditionValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trigger Value</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={form.watch("conditionType") === "cron" ? "*/5 * * * *" : "120"} 
                    className="bg-background/50 border-white/10"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="channelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel ID</FormLabel>
              <FormControl>
                <Input placeholder="123456789012345678" className="bg-background/50 border-white/10 font-mono" {...field} />
              </FormControl>
              <FormDescription>Right click channel in Discord &gt; Copy ID</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={createCommand.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium shadow-lg shadow-primary/25"
        >
          {createCommand.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Command Rule
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
