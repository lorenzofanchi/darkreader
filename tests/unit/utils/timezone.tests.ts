import {getLocationFromTimeZone, getTimeZoneLocationUpdate} from '../../../src/utils/timezone';

test('Location from time zone', () => {
    expect(getLocationFromTimeZone('Europe/Amsterdam')).toEqual({latitude: 52.4, longitude: 4.9, timeZone: 'Europe/Amsterdam'});
    expect(getLocationFromTimeZone('America/Los_Angeles')).toEqual({latitude: 34.1, longitude: -118.2, timeZone: 'America/Los_Angeles'});
    expect(getLocationFromTimeZone('Pacific/Auckland')).toEqual({latitude: -36.9, longitude: 174.8, timeZone: 'Pacific/Auckland'});
    // First and last entries of the table, to catch off-by-one delimiter bugs
    expect(getLocationFromTimeZone('Africa/Abidjan')).toEqual({latitude: 5.3, longitude: -4, timeZone: 'Africa/Abidjan'});
    expect(getLocationFromTimeZone('Pacific/Wallis')).toEqual({latitude: -13.3, longitude: -176.2, timeZone: 'Pacific/Wallis'});
    // Zones without coordinates (UTC, Etc/*, made-up names) must not guess
    expect(getLocationFromTimeZone('UTC')).toEqual(null);
    expect(getLocationFromTimeZone('Etc/GMT+5')).toEqual(null);
    expect(getLocationFromTimeZone('Europe')).toEqual(null);
});

test('Location follows the time zone while travelling', () => {
    const amsterdam = {latitude: 52.4, longitude: 4.9, timeZone: 'Europe/Amsterdam'};

    // Not set yet, and travelling with detected coordinates: follow the time zone
    expect(getTimeZoneLocationUpdate({latitude: null, longitude: null, timeZone: null}, 'Europe/Amsterdam')).toEqual(amsterdam);
    expect(getTimeZoneLocationUpdate(amsterdam, 'Asia/Tokyo')).toEqual({latitude: 35.7, longitude: 139.7, timeZone: 'Asia/Tokyo'});

    // Same time zone: nothing to do
    expect(getTimeZoneLocationUpdate(amsterdam, 'Europe/Amsterdam')).toEqual(null);

    // Manually typed coordinates are never overwritten
    expect(getTimeZoneLocationUpdate({latitude: 59, longitude: 53, timeZone: null}, 'Asia/Tokyo')).toEqual(null);
    expect(getTimeZoneLocationUpdate({latitude: 59, longitude: null, timeZone: null}, 'Asia/Tokyo')).toEqual(null);

    // Clearing both fields opts back in to following the time zone
    expect(getTimeZoneLocationUpdate({latitude: null, longitude: null, timeZone: null}, 'Asia/Tokyo')).toEqual({latitude: 35.7, longitude: 139.7, timeZone: 'Asia/Tokyo'});

    // Settings saved before this field existed still follow the time zone
    expect(getTimeZoneLocationUpdate({latitude: null, longitude: null} as any, 'Asia/Tokyo')).toEqual({latitude: 35.7, longitude: 139.7, timeZone: 'Asia/Tokyo'});

    // A zone without coordinates keeps whatever is stored
    expect(getTimeZoneLocationUpdate(amsterdam, 'UTC')).toEqual(null);
});
