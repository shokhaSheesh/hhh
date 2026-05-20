import { rootApi } from '@/api/client';
import type { UCodeUserPayload } from '@/types/user';

const ENDPOINT = '/v2/items/users?from-ofs=true';

export async function createUser(payload: UCodeUserPayload): Promise<void> {
  await rootApi.post(ENDPOINT, payload);
}

export async function updateUser(payload: UCodeUserPayload): Promise<void> {
  await rootApi.put(ENDPOINT, payload);
}

export async function deleteUser(guid: string): Promise<void> {
  await rootApi.delete(`/v2/items/users/${guid}`, { data: { data: {} } });
}
