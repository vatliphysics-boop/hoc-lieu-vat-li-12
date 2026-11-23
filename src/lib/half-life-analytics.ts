/** Local, consent-based pilot records. No name, account ID or free-text answers. */
export type PilotEventType = "session_started" | "parameter_changed" | "simulation_started" | "simulation_reset" | "measurement" | "camera_rotated" | "accessible_observation" | "prediction_or_answer" | "hint_requested" | "task_completed" | "active_seconds";
export type PilotEvent = {
  schema: "half-life-event/1";
  sessionId: string;
  at: string;
  type: PilotEventType;
  data: Record<string, string | number | boolean>;
};
export function pilotEvent(sessionId: string, type: PilotEventType, data: PilotEvent["data"] = {}, at = new Date().toISOString()): PilotEvent {
  return { schema: "half-life-event/1", sessionId, at, type, data };
}
export function eventsCSV(events: readonly PilotEvent[]): string {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return "\uFEFFschema,session_id,time_utc,event,data_json\r\n" + events.map(event => [event.schema, event.sessionId, event.at, event.type, JSON.stringify(event.data)].map(escape).join(",")).join("\r\n") + "\r\n";
}
