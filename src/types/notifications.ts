export type NotificationType = 'notification' | 'news';

export interface NotificationUser {
  guid:         string;
  name:         string;
  phone:        string;
  photo:        string;
  unique_id:    string;
  active:       boolean;
  balance:      number;
}

export interface Notification {
  guid:        string;
  title_uz:    string | null;
  title_ru:    string | null;
  title_en:    string | null;
  message_uz:  string | null;
  message_ru:  string | null;
  message_en:  string | null;
  type:        NotificationType[];
  image:       string | null;
  file_link:   string | null;
  video_link:  string | null;
  users_id:    string | null;
  users_id_data: NotificationUser | null;
  created_at:  string;
  updated_at:  string;
}

export interface NotificationsListResponse {
  status:         string;
  description:    string;
  custom_message: string;
  data: {
    data: {
      count:    number;
      response: Notification[];
    };
    project_id: string;
  };
}
