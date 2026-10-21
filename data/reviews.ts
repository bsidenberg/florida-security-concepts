// Real reviews only. Leave this empty until a review is copied verbatim,
// with the attribution already attached to it. Do not paraphrase, and do
// not add AggregateRating or Review schema from this file.

export type Review = {
  /** Verbatim review text. Do not edit wording. */
  quote: string;
  /** Name or attribution exactly as it already appears with the review. */
  attribution: string;
  /** Optional source label, such as "Google", when that source is already stated. */
  source?: string;
};

export const reviews: Review[] = [];

/**
 * Google Business Profile URL. Empty until a verified profile link is in the repo.
 * `site.social.google` is the other place that URL can live.
 */
export const googleReviewsUrl = '';
