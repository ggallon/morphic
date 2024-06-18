import { ChatShare } from "./chat-share";

interface UserMessageProps {
  chatId?: string;
  message: string;
  showShare?: boolean;
}

export const UserMessage: React.FC<UserMessageProps> = ({
  chatId,
  message,
  showShare = false,
}) => {
  return (
    <div className="mt-2 flex min-h-10 w-full items-center space-x-1">
      <div className="w-full flex-1 break-words text-xl">{message}</div>
      {showShare && chatId && <ChatShare chatId={chatId} />}
    </div>
  );
};
