export interface Faq {
  guid:         string;
  question_uz:  string | null;
  question_ru:  string | null;
  question_en:  string | null;
  answer_uz:    string | null;
  answer_ru:    string | null;
  answer_en:    string | null;
  created_at:   string;
  updated_at:   string;
}

export interface FaqListResponse {
  status: string;
  data: { data: { count: number; response: Faq[] } };
}
