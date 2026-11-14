export const MARK = 'dk-test-kancalari-v1';
export function install(api) { window.DK = { ...api, sim: (s) => s, mark: MARK }; }
