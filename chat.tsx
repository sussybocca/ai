import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain, Moon, Sun, Send, Copy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/ui/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

interface GenerateResponse {
  id: string;
  prompt: string;
  response: string;
  createdAt: string;
  tokens: number;
}

export default function Chat() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/generate", { prompt });
      return response.json() as Promise<GenerateResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setPrompt("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error generating response",
        description: error.message || "Failed to generate AI response. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || trimmedPrompt.length > 2000) return;
    
    setIsGenerating(true);
    generateMutation.mutate(trimmedPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && prompt.length <= 2000 && !isGenerating) {
        handleSubmit(e);
      }
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + "px";
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Response has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [prompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const isSubmitDisabled = !prompt.trim() || prompt.length > 2000 || isGenerating;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="text-primary-foreground" size={16} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">AI Text Generator</h1>
                <p className="text-sm text-muted-foreground">Powered by Gemini API</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
              className="hover:bg-accent"
            >
              {theme === "dark" ? (
                <Sun className="text-muted-foreground hover:text-foreground" size={18} />
              ) : (
                <Moon className="text-muted-foreground hover:text-foreground" size={18} />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Message */}
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="text-2xl text-accent-foreground" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Welcome to AI Text Generator
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start a conversation by typing your prompt below. I can help with writing,
                analysis, creative tasks, and more.
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div key={message.id} className="animate-fadeIn">
              {/* User Message */}
              <div className="flex justify-end mb-4">
                <div className="max-w-3xl">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3 break-words">
                    <p data-testid={`text-user-message-${message.id}`}>
                      {message.prompt}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 text-right">
                    <span data-testid={`text-timestamp-${message.id}`}>
                      {formatTimestamp(message.createdAt.toString())}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex justify-start mb-6">
                <div className="max-w-3xl">
                  <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                        <Brain className="text-accent-foreground" size={12} />
                      </div>
                      <div className="flex-1">
                        <p 
                          className="text-foreground leading-relaxed whitespace-pre-wrap break-words"
                          data-testid={`text-ai-response-${message.id}`}
                        >
                          {message.response}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center space-x-2">
                    <span>{formatTimestamp(message.createdAt.toString())}</span>
                    <span>•</span>
                    <span>{Math.floor(message.response.length / 4)} tokens</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-2 hover:text-foreground transition-colors"
                      onClick={() => copyToClipboard(message.response)}
                      data-testid={`button-copy-${message.id}`}
                      title="Copy response"
                    >
                      <Copy size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Loading State */}
          {isGenerating && (
            <div className="animate-fadeIn">
              <div className="flex justify-start">
                <div className="max-w-3xl">
                  <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                        <Brain className="text-accent-foreground" size={12} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span className="text-muted-foreground" data-testid="text-loading">
                          AI is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {generateMutation.isError && (
            <div className="animate-fadeIn">
              <div className="flex justify-start">
                <div className="max-w-3xl">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="text-destructive mt-1" size={16} />
                      <div>
                        <p className="text-destructive font-medium" data-testid="text-error-title">
                          Error generating response
                        </p>
                        <p className="text-destructive/80 text-sm mt-1" data-testid="text-error-message">
                          {generateMutation.error?.message || "Failed to generate AI response. Please check your connection and try again."}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive/80 text-sm mt-2 underline h-auto p-0"
                          onClick={() => generateMutation.mutate(prompt.trim())}
                          data-testid="button-retry"
                        >
                          Try again
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Section */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="relative" data-testid="form-prompt">
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <label htmlFor="prompt-input" className="sr-only">
                  Enter your prompt
                </label>
                <Textarea
                  ref={textareaRef}
                  id="prompt-input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message here..."
                  className="min-h-[48px] max-h-32 resize-none bg-input border border-border rounded-xl px-4 py-3 pr-12 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                  data-testid="input-prompt"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isSubmitDisabled}
                  className="absolute right-3 bottom-3 w-8 h-8 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-primary-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  data-testid="button-send"
                >
                  <Send size={14} />
                </Button>
              </div>
            </div>

            {/* Character Count */}
            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-4">
                <span>Press Enter + Shift for new line</span>
              </div>
              <span 
                className={prompt.length > 2000 ? "text-destructive" : ""}
                data-testid="text-char-count"
              >
                {prompt.length} / 2000
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
