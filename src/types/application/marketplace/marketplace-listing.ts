import type { MarketplaceKind } from "@/constants/marketplace-kinds";
import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

export type MarketplaceListing = {
  id: string;
  sellerId: string;
  /** Nome e @ de quem publicou (podem faltar em contas removidas). */
  sellerName?: string | null;
  sellerUsername?: string | null;
  /** Personalização do nome de quem publicou (tema/fonte/cor). */
  sellerStyle?: AuthorNameStyle | null;
  itemKind: MarketplaceKind;
  itemId: string;
  title: string;
  description?: string | null;
  price: number;
  status: "ACTIVE" | "SOLD" | "REMOVED";
  createdAt: string;
};
