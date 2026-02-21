import { useForm, useFieldArray } from "react-hook-form";
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
import { Loader2, Plus, Terminal, Trash2, Clock, MessageSquare } from "lucide-react";

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
      actions: [{ type: 'message', value: '' }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "actions"
  });

  function onSubmit(data: InsertCommand) {
    // If name is empty, use the first action's value as name
    if (!data.name && data.actions.length > 0) {
      data.name = data.actions[0].value.substring(0, 50);
    }
    createCommand.mutate(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  }

  const conditionType = form.watch("conditionType");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 p-4 border border-white/5 rounded-lg bg-black/20">
          <h3 className="text-sm font-medium flex items-center gap-2 text-primary">
            <Clock className="h-4 w-4" /> Trigger Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="conditionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50 border-white/10">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="interval">Interval (Minutes)</SelectItem>
                      <SelectItem value="message">On Message Content</SelectItem>
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
                  <FormLabel>{conditionType === 'interval' ? 'Minutes' : 'Filter (JSON)'}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={conditionType === "interval" ? "120" : '{"content": "hello", "matchType": "contains"}'} 
                      className="bg-background/50 border-white/10"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    {conditionType === 'message' && 'JSON: {"content": "text", "matchType": "exact|startsWith|contains", "userId": "ID"}'}
                  </FormDescription>
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
                <FormLabel>Target Channel ID</FormLabel>
                <FormControl>
                  <Input placeholder="123456789012345678" className="bg-background/50 border-white/10 font-mono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetBotId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Bot ID (for Slash Commands)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="ID of the bot that owns the /command" 
                    className="bg-background/50 border-white/10 font-mono" 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription className="text-[10px]">Required if you use slash commands like /topargent</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 p-4 border border-white/5 rounded-lg bg-black/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2 text-primary">
              <MessageSquare className="h-4 w-4" /> Sequence Actions
            </h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => append({ type: 'message', value: '' })}
              className="h-7 text-[10px] border-white/10 hover:bg-white/5"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Action
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start bg-background/30 p-2 rounded border border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                  <FormField
                    control={form.control}
                    name={`actions.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 bg-background/50 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="message">Send Message</SelectItem>
                            <SelectItem value="wait">Wait (ms)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`actions.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormControl>
                          <Input 
                            className="h-9 bg-background/50 border-white/10" 
                            placeholder={form.watch(`actions.${index}.type`) === 'wait' ? "1000" : "Message or /command"}
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

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
              Save Nexus Rule
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
