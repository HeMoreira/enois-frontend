import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

export type ServiceListing = {
  id: string;
  sellerId: string;
  /** Quem vai prestar o servico (nome e foto): um servico sem rosto nao diz para quem e. */
  sellerName: string | null;
  sellerAvatar: string | null;
  /** Personalização do nome de quem presta o serviço (tema/fonte/cor). */
  sellerStyle?: AuthorNameStyle | null;
  category: string;
  title: string;
  description: string;
  deliverables: string;
  price: number;
  /** FAISCA (escrow, milesimos de faisca) ou BRL (pagamento direto, centavos). */
  currency: "BRL" | "FAISCA" | string;
  deliveryDays: number;
  status: "ACTIVE" | "REMOVED";
  createdAt: string;
};
