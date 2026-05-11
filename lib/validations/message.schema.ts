import { z } from "zod";

export const sendMessageSchema = z
  .object({
    receiverId: z.string().min(1).max(128),
    text: z
      .string()
      .max(8000)
      .optional()
      .transform((s) => (typeof s === "string" ? s.trim() : s)),
    fileUrl: z.string().url().optional(),
    fileType: z.enum(["PDF", "IMAGE"]).optional(),
    fileName: z.string().max(512).optional(),
    voiceUrl: z.string().url().optional(),
    voiceDuration: z.number().int().min(1).max(3600).optional(),
  })
  .superRefine((data, ctx) => {
    const hasText = Boolean(data.text && data.text.length > 0);
    const hasFile = Boolean(data.fileUrl && data.fileType);
    const hasVoice = Boolean(data.voiceUrl);
    const modes = [hasText, hasFile, hasVoice].filter(Boolean).length;
    if (modes !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide exactly one of text, file, or voice",
      });
    }
    if (hasFile && (!data.fileUrl || !data.fileType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fileUrl and fileType are required together",
        path: ["fileUrl"],
      });
    }
    if (hasVoice && data.voiceDuration == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "voiceDuration is required for voice messages",
        path: ["voiceDuration"],
      });
    }
  });

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const markReadSchema = z.object({
  peerId: z.string().min(1).max(128),
});
