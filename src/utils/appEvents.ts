/**
 * App-wide UI events.
 *
 * Some entry points live far from the component that owns the UI they open: the "+" button in
 * the bottom bar opens the Add Plant dialog, and the bell in the Home header opens the
 * notification center, which is mounted by the navigation. These window events connect the two
 * without threading callbacks through the router.
 */

export const OPEN_ADD_PLANT_EVENT = "sprouthub:open-add-plant";
export const OPEN_NOTIFICATIONS_EVENT = "sprouthub:open-notifications";

export function openAddPlant() {
  window.dispatchEvent(new Event(OPEN_ADD_PLANT_EVENT));
}

export function openNotificationCenter() {
  window.dispatchEvent(new Event(OPEN_NOTIFICATIONS_EVENT));
}
