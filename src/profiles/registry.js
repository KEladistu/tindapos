import { sariSariProfile } from './sari-sari/profile';
import { lpgProfile } from './lpg/profile';
import { restaurantProfile } from './restaurant/profile';
export const profileRegistry = {
    'sari-sari': { profile: sariSariProfile, available: true },
    'lpg': { profile: lpgProfile, available: false },
    'restaurant': { profile: restaurantProfile, available: false }
};
export function getProfile(id) {
    return profileRegistry[id].profile;
}
