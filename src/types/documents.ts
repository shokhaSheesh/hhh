export interface Document {
  guid:          string;
  document_type: string[];
  name_uz:       string | null;
  name_ru:       string | null;
  name_en:       string | null;
  text_uz:       string | null;
  text_ru:       string | null;
  text_en:       string | null;
  files_uz:      string[];
  files_ru:      string[];
  files_en:      string[];
  created_at:    string;
  updated_at:    string;
}

export interface DocumentsListResponse {
  status: string;
  data: {
    data: {
      count:    number;
      response: Document[];
    };
  };
}
