import { Index } from "@upstash/vector";

let _instance: Index | null = null;

export function getVectorIndex(): Index {
  if (!_instance) {
    _instance = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    });
  }
  return _instance;
}
