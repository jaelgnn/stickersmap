export type VoteChoice = "upvote" | "downvote" | null;
export type StickerPresenceStatus = "seen" | "removed";

export type StickerReportDto = {
  id: string;
  image_path: string;
  lat: number;
  lng: number;
  captured_at: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
  upvotes: number;
  downvotes: number;
  last_status: StickerPresenceStatus | null;
  last_status_at: string | null;
};

export type CreateStickerReportPayload = {
  imagePath: string;
  lat: number;
  lng: number;
  capturedAt: string;
  uploadedBy: string;
};

export type UpdateStickerVotePayload = {
  stickerId: string;
  currentChoice: VoteChoice;
  nextChoice: VoteChoice;
};
