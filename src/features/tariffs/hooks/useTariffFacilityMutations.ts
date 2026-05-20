import { rootApi } from '@/api/client';

export interface FacilityUpdatePayload {
  description_uz: string;
  description_ru: string;
  description_en: string;
}

export async function createFacility(
  tariffId: string,
  data: FacilityUpdatePayload,
): Promise<void> {
  await rootApi.post('/v2/items/tariff_facilities?from-ofs=true', {
    data: {
      tariffs_id:     tariffId,
      description_uz: data.description_uz,
      description_ru: data.description_ru,
      description_en: data.description_en,
    },
    disable_faas: true,
  });
}

export async function deleteFacility(facilityGuid: string): Promise<void> {
  await rootApi.delete(`/v2/items/tariff_facilities/${facilityGuid}?from-ofs=true`, {
    data: { data: {} },
  });
}

export async function updateFacility(
  facilityGuid: string,
  tariffId: string,
  data: FacilityUpdatePayload,
): Promise<void> {
  await rootApi.put('/v2/items/tariff_facilities?from-ofs=true', {
    data: {
      guid:           facilityGuid,
      tariffs_id:     tariffId,
      description_uz: data.description_uz,
      description_ru: data.description_ru,
      description_en: data.description_en,
    },
    disable_faas: true,
  });
}
