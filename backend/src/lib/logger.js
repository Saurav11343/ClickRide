import { env } from "../config/env.js";

const write = (level, message, metadata) => {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(metadata && !env.isProduction ? { metadata } : {}),
  };

  const output = JSON.stringify(entry);
  if (level === "error") process.stderr.write(`${output}\n`);
  else process.stdout.write(`${output}\n`);
};

export const logger = {
  info: (message, metadata) => write("info", message, metadata),
  warn: (message, metadata) => write("warn", message, metadata),
  error: (message, metadata) => write("error", message, metadata),
};
