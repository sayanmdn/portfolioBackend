const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf } = format;

const localLogger = () => {
  const myFormat = printf(({ message, timestamp }) => {
    return `${timestamp}: ${message}`;
  });

  return createLogger({
    level: "debug",
    format: combine(
    //   format.colorize(),
    //   label({ label: "right meow!" }),
      timestamp({ format: "DD:MM:YYYY HH:mm:ss" }),
      myFormat
    ),

    //defaultMeta: { service: 'user-service' },
    transports: [
      new transports.Console(),
      new transports.File({
        filename: "logger/data/default.log",
      }),
    ],
  });
};

module.exports = localLogger;
