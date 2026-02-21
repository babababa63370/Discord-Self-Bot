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
      userId: "",
      matchType: "contains",
      isActive: true,
      actions: [{ type: 'message', value: '' }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "actions"
  });

  function onSubmit(data: InsertCommand) {
    const actions = data.actions || [];
    // Basic validation: ensure we have at least one action with a value
    if (actions.length === 0 || actions.every((a: any) => !a.value && a.type !== 'wait')) {
      return;
    }

    // If name is empty, use the first action's value as name
    if (!data.name && actions.length > 0) {
      data.name = actions[0].value.substring(0, 50) || "Unnamed Rule";
    }
    
    // Clean up empty strings for IDs
    if (!data.userId) data.userId = null;
    if (!data.targetBotId) data.targetBotId = null;

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
                  <FormLabel>{conditionType === 'interval' ? 'Minutes' : 'Message Content'}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={conditionType === "interval" ? "120" : 'Hello world'} 
                      className="bg-background/50 border-white/10"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {conditionType === 'message' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="matchType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Strategy</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'contains'}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="exact">Exact Match</SelectItem>
                        <SelectItem value="startsWith">Starts With</SelectItem>
                        <SelectItem value="regex">Regex Pattern</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Filter by User ID (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123456789..." 
                        className="bg-background/50 border-white/10 font-mono" 
                        {...field} 
                        value={(field.value as string) || ''}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}

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
                    value={(field.value as string) || ''}
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
                    name={`actions.${index}.type` as any}
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                          <FormControl>
                            <SelectTrigger className="h-9 bg-background/50 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="message">💬 Send Message</SelectItem>
                            <SelectItem value="action">⚡ Action / Slash</SelectItem>
                            <SelectItem value="wait">⏳ Wait (ms)</SelectItem>
                            <SelectItem value="if_contains">🔍 If Contains</SelectItem>
                            <SelectItem value="if_author">👤 If Author ID</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`actions.${index}.value` as any}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormControl>
                          <Input 
                            className="h-9 bg-background/50 border-white/10" 
                            placeholder={
                              form.watch(`actions.${index}.type` as any) === 'wait' ? "1000 (ms)" : 
                              form.watch(`actions.${index}.type` as any) === 'if_contains' ? "Text to search..." :
                              form.watch(`actions.${index}.type` as any) === 'if_author' ? "Discord User ID..." :
                              "Message or /command"
                            }
                            {...field} 
                            value={(field.value as string) || ''}
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
          <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/10">
            <p className="text-[10px] text-muted-foreground">
              💡 Use <code className="text-primary">{"{{author}}"}</code>, <code className="text-primary">{"{{content}}"}</code>, or <code className="text-primary">{"{{channel}}"}</code> as variables.
            </p>
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
