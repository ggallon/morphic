import { auth } from "@/auth";
import { History } from "./history";
import { HistoryList } from "./history-list";

interface HistoryContainerProps {
  location: "sidebar" | "header";
}

export const HistoryContainer: React.FC<HistoryContainerProps> = async ({
  location,
}) => {
  const session = await auth();
  return (
    <div
      className={location === "header" ? "block sm:hidden" : "hidden sm:block"}
    >
      <History location={location}>
        <HistoryList userId={session?.user?.id} />
      </History>
    </div>
  );
};
