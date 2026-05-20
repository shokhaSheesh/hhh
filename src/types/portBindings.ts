export interface PortBatteryData {
  guid:       string;
  soc:        number;
  soh:        number;
  battery_sn: string;
  status:     string;
}

export interface PortDeviceData {
  guid:        string;
  device_code: string;
  device_name: string;
}

export interface PortBinding {
  guid:              string;
  port:              number;
  batteries_id_data: PortBatteryData | null;
  devices_id_data:   PortDeviceData  | null;
  door_status:       boolean;
  enabled_status:    boolean;
  port_status:       boolean;
}

export interface PortBindingsListResponse {
  status:      string;
  description: string;
  data: {
    data: {
      count:    number;
      response: PortBinding[];
    };
  };
}
