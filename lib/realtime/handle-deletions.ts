/**
 * Type guard to check if a payload is a deleted record
 * @param payload The payload to check
 * @returns True if the payload is a deleted record
 */
export function isDeletedRecord(payload: any): boolean {
  return payload && typeof payload === "object" && payload.__deleted === true
}

/**
 * Extract the ID from a deleted record payload
 * @param payload The payload to extract from
 * @returns The ID of the deleted record
 */
export function getDeletedRecordId(payload: any): string | null {
  if (isDeletedRecord(payload) && payload.id) {
    return payload.id
  }
  return null
}

/**
 * Handle a real-time payload, checking if it's a deletion
 * @param payload The payload to handle
 * @param updateCallback Callback for updates/inserts
 * @param deleteCallback Callback for deletions
 */
export function handleRealtimePayload<T>(
  payload: any,
  updateCallback: (data: T) => void,
  deleteCallback: (id: string) => void,
): void {
  if (isDeletedRecord(payload)) {
    const id = getDeletedRecordId(payload)
    if (id) {
      deleteCallback(id)
    }
  } else {
    updateCallback(payload as T)
  }
}
