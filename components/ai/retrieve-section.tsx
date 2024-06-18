import type { SearchResults as SearchResultsType } from "@/lib/types";
import { SearchResults } from "./search-results";
import { Section } from "./section";

interface RetrieveSectionProps {
  data: SearchResultsType;
}

export const RetrieveSection: React.FC<RetrieveSectionProps> = ({ data }) => {
  return (
    <Section title="Sources">
      <SearchResults results={data.results} />
    </Section>
  );
};
