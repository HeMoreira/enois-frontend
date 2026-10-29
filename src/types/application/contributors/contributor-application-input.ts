export type ContributorApplicationInput = {
  name: string;
  github: string;
  email: string;
  area?: string;
  experience?: string;
  message?: string;
  acceptedTerms: boolean;
};
