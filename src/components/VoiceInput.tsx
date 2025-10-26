import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
}

export const VoiceInput = ({ onTranscript, isListening, setIsListening }: VoiceInputProps) => {
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        onTranscript(transcript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        toast.error("Voice recognition error. Please try again.");
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onTranscript, setIsListening]);

  const toggleListening = () => {
    if (!recognition) {
      toast.error("Voice recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast.success("Listening...");
    }
  };

  return (
    <Button
      onClick={toggleListening}
      size="lg"
      className={`
        relative w-16 h-16 rounded-full p-0 glass transition-smooth
        ${isListening 
          ? "bg-accent glow-accent animate-glow-pulse" 
          : "bg-primary glow-primary hover:scale-110"
        }
      `}
    >
      {isListening ? (
        <MicOff className="w-7 h-7" />
      ) : (
        <Mic className="w-7 h-7" />
      )}
      {isListening && (
        <span className="absolute inset-0 rounded-full border-2 border-accent animate-ping" />
      )}
    </Button>
  );
};
