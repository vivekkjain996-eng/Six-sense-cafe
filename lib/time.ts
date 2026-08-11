const IST_TIME_ZONE = "Asia/Kolkata";

export function formatISTDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: IST_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatISTTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("en-IN", {
    timeZone: IST_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
}
