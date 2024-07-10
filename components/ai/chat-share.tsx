"use client";

import { useState, useTransition } from "react";
import { Share } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { shareChat } from "@/lib/actions/chat";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";

interface ChatShareProps {
  chatId: string;
  className?: string;
}

export function ChatShare({ chatId, className }: ChatShareProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { copyToClipboard } = useCopyToClipboard({ timeout: 1000 });
  const [shareUrl, setShareUrl] = useState("");

  const handleShare = async () => {
    startTransition(() => {
      setOpen(true);
    });
    const { data, error } = await shareChat(chatId);
    if (error) {
      toast.error("Failed to share chat");
      return;
    }

    if (!data?.sharePath) {
      toast.error("Could not copy link to clipboard");
      return;
    }

    const url = new URL(data.sharePath, window.location.href);
    setShareUrl(url.toString());
  };

  const handleCopy = () => {
    if (shareUrl) {
      copyToClipboard(shareUrl);
      toast.success("Link copied to clipboard");
      setOpen(false);
    } else {
      toast.error("No link to copy");
    }
  };

  return (
    <div className={className}>
      <Dialog
        open={open}
        onOpenChange={(open) => setOpen(open)}
        aria-labelledby="share-dialog-title"
        aria-describedby="share-dialog-description"
      >
        <DialogTrigger asChild>
          <Button
            className="rounded-full"
            size="icon"
            variant="ghost"
            onClick={() => setOpen(true)}
          >
            <Share size={14} />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share link to search result</DialogTitle>
            <DialogDescription>
              Anyone with the link will be able to view this search result.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="items-center">
            {!shareUrl && (
              <Button onClick={handleShare} disabled={pending} size="sm">
                {pending ? <Spinner /> : "Get link"}
              </Button>
            )}
            {shareUrl && (
              <Button onClick={handleCopy} disabled={pending} size="sm">
                {"Copy link"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
