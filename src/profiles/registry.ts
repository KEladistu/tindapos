import type { BusinessProfile } from './types';
import { sariSariProfile } from './sari-sari/profile';
import { lpgProfile } from './lpg/profile';
import { restaurantProfile } from './restaurant/profile';

export interface RegistryEntry {
  profile: BusinessProfile;
  /** Phase 1: only sari-sari is fully implemented. */
  available: boolean;
}

export const profileRegistry: Record<BusinessProfile['id'], RegistryEntry> = {
  'sari-sari': { profile: sariSariProfile, available: true },
  'lpg':       { profile: lpgProfile,      available: true },
  'restaurant':{ profile: restaurantProfile, available: false }
};

export function getProfile(id: BusinessProfile['id']): BusinessProfile {
  return profileRegistry[id].profile;
}
