"use client";

import { Paperclip, Send, Smile } from "lucide-react";
import type { RefObject } from "react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder } from "@/components/dm/VoiceRecorder";
import { cn } from "@/lib/utils/cn";

type DmComposeBarProps = {
  text: string;
  setText: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  emojiOpen: boolean;
  setEmojiOpen: (open: boolean) => void;
  onEmoji: (emoji: EmojiClickData) => void;
  onAttach: (file: File) => void;
  onSendText: () => void;
  onVoiceBlob: (blob: Blob, durationSec: number) => void;
  sendDisabled: boolean;
};

export function DmComposeBar({
  text,
  setText,
  textareaRef,
  emojiOpen,
  setEmojiOpen,
  onEmoji,
  onAttach,
  onSendText,
  onVoiceBlob,
  sendDisabled,
}: DmComposeBarProps) {
  const hasText = text.trim().length > 0;

  return (
    <div className="shrink-0 border-t border-navy-100 bg-white px-4 py-3">
      <div className="message-input-bar">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message"
          rows={1}
          className="message-input min-h-12 max-h-28 w-full resize-none border-none bg-transparent py-2.5 pl-1 pr-28 text-sm text-navy-900 placeholder:text-navy-400 focus-visible:ring-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (hasText) onSendText();
            }
          }}
        />

        <div className="input-icons">
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="input-icon-btn"
                aria-label="Emoji"
              >
                <Smile className="h-5 w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-0 p-0 shadow-xl" align="end" side="top">
              <EmojiPicker theme={Theme.DARK} onEmojiClick={onEmoji} />
            </PopoverContent>
          </Popover>

          <label className="input-icon-btn cursor-pointer">
            <Paperclip className="h-5 w-5" />
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) onAttach(f);
              }}
            />
          </label>

          <div className="relative flex h-9 w-9 items-center justify-center">
            <button
              type="button"
              className={cn(
                "input-icon-btn send-btn absolute flex h-9 w-9 items-center justify-center rounded-full bg-gold-600 text-navy-900 transition-all duration-200 hover:bg-gold-500 disabled:opacity-60",
                hasText ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0",
              )}
              onClick={onSendText}
              disabled={sendDisabled || !hasText}
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
            <div
              className={cn(
                "transition-all duration-200",
                hasText ? "pointer-events-none scale-75 opacity-0" : "scale-100 opacity-100",
              )}
            >
              <VoiceRecorder disabled={sendDisabled} onRecorded={onVoiceBlob} inline />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
