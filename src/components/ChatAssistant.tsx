import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getAssistantResponse } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  parts: string;
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', parts: 'Namaskaram! Njan Gadgenix AI Assistant aanu. How can I help you today? Check out our P9 Headsets and M19 Earbuds!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', parts: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getAssistantResponse(newMessages);
      setMessages([...newMessages, { role: 'model', parts: response }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'model', parts: 'Sorry, something went wrong. WhatsApp support contact cheyyoo!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4"
          >
            <Card className="w-[350px] sm:w-[400px] h-[500px] flex flex-col glass border-white/10 shadow-2xl overflow-hidden rounded-3xl">
              {/* Header */}
              <div className="p-4 bg-primary flex items-center justify-between">
                <div className="flex items-center gap-2 text-background">
                  <Bot className="w-5 h-5" />
                  <span className="font-bold tracking-tight">GADGENIX AI</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="text-background hover:bg-background/20 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Messages */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
              >
                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-accent' : 'bg-primary'}`}>
                        {msg.role === 'user' ? <User className="w-3 h-3 text-white" /> : <Bot className="w-3 h-3 text-background" />}
                      </div>
                      <div className={`p-3 rounded-2xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-accent/20 text-white rounded-tr-none' 
                          : 'bg-white/5 text-muted-foreground rounded-tl-none'
                      }`}>
                        {msg.parts}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-2 items-center bg-white/5 p-3 rounded-2xl rounded-tl-none">
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground italic">Typing...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/5 bg-white/5">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ask something..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="bg-background/50 border-white/10 rounded-full focus:border-primary"
                  />
                  <Button 
                    size="icon" 
                    onClick={handleSend}
                    disabled={isLoading}
                    className="rounded-full bg-primary text-background hover:bg-primary/90 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground uppercase tracking-widest">
                  <MessageCircle className="w-3 h-3" /> WhatsApp Support Available
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-full w-14 h-14 shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-accent rotate-90' : 'bg-primary hover:scale-110'
        }`}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-background" />}
      </Button>
    </div>
  );
}
